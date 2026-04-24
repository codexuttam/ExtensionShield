"""
Summary Generator

Generates executive summaries from all analysis results with overall risk assessment.
"""

import os
import json
import logging
from typing import Dict, Optional, Any
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from extension_shield.llm.prompts import get_prompts
from extension_shield.llm.clients.fallback import invoke_with_fallback
from extension_shield.llm.validators import validate_summary, validate_summary_not_generic
from extension_shield.core.impact_analyzer import ImpactAnalyzer

load_dotenv()
logger = logging.getLogger(__name__)


def _summary_contradicts_label(text: str, score_label: str) -> bool:
    """
    Check if executive summary text contradicts the authoritative score_label.

    Returns True if the text contains wording that conflicts with the risk label,
    e.g. a LOW RISK label paired with "high risk" language.
    """
    t = (text or "").lower()
    if score_label == "LOW RISK":
        return any(x in t for x in ["high risk", "high-risk", "critical", "avoid", "severe"])
    if score_label == "HIGH RISK":
        return any(x in t for x in ["low risk", "low-risk", "safe", "no concerns", "no risk"])
    return False


def _extract_response_model_version(response: Any) -> Optional[str]:
    """Best-effort extraction of the actual model identifier returned by the LLM client."""
    if response is None:
        return None

    direct_value = getattr(response, "model", None) or getattr(response, "model_name", None)
    if isinstance(direct_value, str) and direct_value.strip():
        return direct_value.strip()

    response_metadata = getattr(response, "response_metadata", None)
    if isinstance(response_metadata, dict):
        for key in ("model_name", "model", "model_id", "deployment_name"):
            value = response_metadata.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    additional_kwargs = getattr(response, "additional_kwargs", None)
    if isinstance(additional_kwargs, dict):
        for key in ("model_name", "model", "model_id"):
            value = additional_kwargs.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return None


def _attach_model_version(summary: Dict[str, Any], model_version: Optional[str]) -> Dict[str, Any]:
    """Return a shallow copy of a summary with model_version attached when known."""
    normalized = dict(summary) if isinstance(summary, dict) else {}
    if model_version:
        normalized["model_version"] = model_version
    return normalized


class SummaryGenerator:
    """Generates executive summaries from all analysis results."""

    @staticmethod
    def _map_risk_label(risk_level: str) -> str:
        """Map internal risk level to prompt label."""
        risk_level = (risk_level or "").lower()
        if risk_level in ("critical", "high"):
            return "HIGH RISK"
        if risk_level == "medium":
            return "MEDIUM RISK"
        return "LOW RISK"

    @staticmethod
    def _normalize_label_to_level(score_label: str) -> str:
        """Map prompt label to legacy risk level."""
        label = (score_label or "").upper()
        if label.startswith("HIGH"):
            return "high"
        if label.startswith("MEDIUM"):
            return "medium"
        return "low"

    @staticmethod
    def _json_block(value: Optional[Dict]) -> str:
        """Serialize a dict to a stable JSON block for prompt injection."""
        try:
            return json.dumps(value or {}, indent=2, sort_keys=True, ensure_ascii=True)
        except (TypeError, ValueError):
            return json.dumps(str(value), ensure_ascii=True)

    @staticmethod
    def _classify_host_access_scope(manifest: Dict) -> Dict[str, Any]:
        """
        Classify host access scope from manifest data.
        
        Returns:
            Dict with:
            - host_scope_label: "ALL_WEBSITES" | "MULTI_DOMAIN" | "SINGLE_DOMAIN" | "NONE"
            - patterns_count: Total number of host permission patterns
            - domains: Top 10 unique domains (if applicable)
            - has_all_urls: True if broad host access is present
        """
        # Broad patterns that indicate all websites access
        broad_patterns = [
            "<all_urls>",
            "*://*/*",
            "http://*/*",
            "https://*/*",
            "file:///*",
        ]
        
        # Get host permissions (MV3) or from permissions array (MV2)
        host_permissions = manifest.get("host_permissions", [])
        if not host_permissions:
            # Check permissions array for URL patterns (MV2)
            permissions = manifest.get("permissions", [])
            url_indicators = ["://", "*://", "http://", "https://", "file://", "ftp://", "<all_urls>"]
            host_permissions = [
                p for p in permissions
                if isinstance(p, str) and any(ind in p for ind in url_indicators)
            ]
        
        if not host_permissions:
            return {
                "host_scope_label": "NONE",
                "patterns_count": 0,
                "domains": [],
                "has_all_urls": False,
            }
        
        # Check for broad patterns
        has_all_urls = "<all_urls>" in host_permissions
        has_broad = any(pattern in host_permissions for pattern in broad_patterns)
        if has_broad:
            return {
                "host_scope_label": "ALL_WEBSITES",
                "patterns_count": len(host_permissions),
                "domains": [],
                "has_all_urls": has_all_urls,
            }
        
        # Extract unique domains from specific patterns
        import re
        domains = set()
        for pattern in host_permissions:
            # Extract domain from patterns like "https://*.example.com/*" or "https://example.com/*"
            match = re.search(r"(?:https?://)?(?:\*\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)", pattern)
            if match:
                domains.add(match.group(1).lower())
        
        domain_count = len(domains)
        top_domains = sorted(domains)[:10]
        
        if domain_count == 0:
            # Couldn't extract domains, but has patterns - treat as multi-domain
            return {
                "host_scope_label": "MULTI_DOMAIN",
                "patterns_count": len(host_permissions),
                "domains": [],
                "has_all_urls": has_all_urls,
            }
        if domain_count == 1:
            return {
                "host_scope_label": "SINGLE_DOMAIN",
                "patterns_count": len(host_permissions),
                "domains": top_domains,
                "has_all_urls": has_all_urls,
            }
        return {
            "host_scope_label": "MULTI_DOMAIN",
            "patterns_count": len(host_permissions),
            "domains": top_domains,
            "has_all_urls": has_all_urls,
        }

    def _compute_score_context(
        self,
        analysis_results: Dict,
        manifest: Dict,
        metadata: Optional[Dict],
        scan_id: Optional[str],
        extension_id: Optional[str],
        return_details: bool = False,
    ):
        """Compute score + label for summary prompt, with safe fallback."""
        score = 0
        score_label = "LOW RISK"
        scoring_result = None
        scoring_engine = None
        signal_pack = None

        try:
            from extension_shield.governance.tool_adapters import SignalPackBuilder
            from extension_shield.scoring.engine import ScoringEngine

            signal_pack_builder = SignalPackBuilder()
            signal_pack = signal_pack_builder.build(
                scan_id=scan_id or "summary",
                analysis_results=analysis_results,
                metadata=metadata or {},
                manifest=manifest or {},
                extension_id=extension_id,
            )

            user_count = signal_pack.webstore_stats.installs
            if user_count is None and metadata:
                raw_count = metadata.get("user_count") or metadata.get("users")
                if raw_count is not None:
                    try:
                        user_count = int(str(raw_count).replace(",", "").replace("+", ""))
                    except ValueError:
                        user_count = None

            scoring_engine = ScoringEngine(weights_version="v1")
            scoring_result = scoring_engine.calculate_scores(
                signal_pack=signal_pack,
                manifest=manifest,
                user_count=user_count,
                permissions_analysis=analysis_results.get("permissions_analysis"),
            )

            score = int(scoring_result.overall_score)
            score_label = self._map_risk_label(scoring_result.risk_level.value)
        except Exception as exc:
            logger.warning("Failed to compute score context for summary: %s", exc)
            # Default to MEDIUM RISK on error — never lie about risk direction.
            score = 0
            score_label = "MEDIUM RISK"

        if return_details:
            return score, score_label, scoring_result, scoring_engine, signal_pack

        return score, score_label

    def _build_facts_pack(
        self,
        analysis_results: Dict,
        manifest: Dict,
        metadata: Optional[Dict],
        scan_id: Optional[str],
        extension_id: Optional[str],
    ) -> tuple[Dict[str, Any], int, str, str]:
        """
        Build a structured facts pack for summary_rewrite.

        Returns:
            facts_pack, score, score_label, host_scope_label
        """
        metadata = metadata or {}
        score, score_label, scoring_result, scoring_engine, signal_pack = self._compute_score_context(
            analysis_results=analysis_results,
            manifest=manifest,
            metadata=metadata,
            scan_id=scan_id,
            extension_id=extension_id,
            return_details=True,
        )

        host_access_summary = self._classify_host_access_scope(manifest or {})
        host_scope_label = host_access_summary.get("host_scope_label", "UNKNOWN")

        gate_results = []
        if scoring_engine and hasattr(scoring_engine, "_last_gate_results"):
            gate_results = scoring_engine._last_gate_results or []

        gate_summaries = [
            {
                "gate_id": g.gate_id,
                "decision": g.decision,
                "confidence": g.confidence,
                "reasons": g.reasons,
            }
            for g in gate_results
            if getattr(g, "triggered", False)
        ]

        # Gather permissions from manifest
        manifest_permissions = {
            "permissions": manifest.get("permissions", []) if isinstance(manifest, dict) else [],
            "host_permissions": manifest.get("host_permissions", []) if isinstance(manifest, dict) else [],
            "optional_permissions": manifest.get("optional_permissions", []) if isinstance(manifest, dict) else [],
        }

        # Compute capability flags for richer facts
        impact_analyzer = ImpactAnalyzer()
        external_domains = impact_analyzer._extract_external_domains(analysis_results)
        network_evidence = ImpactAnalyzer._extract_network_evidence_from_sast(
            analysis_results.get("javascript_analysis")
        )
        capability_flags = impact_analyzer._compute_capability_flags(
            manifest=manifest,
            analysis_results=analysis_results,
            host_access_summary=host_access_summary,
            external_domains=external_domains,
            network_evidence=network_evidence,
        )

        facts_pack = {
            "score": score,
            "score_label": score_label,
            "host_access": host_access_summary,
            "manifest_permissions": manifest_permissions,
            "permissions_summary": analysis_results.get("permissions_analysis") or {},
            "webstore": analysis_results.get("webstore_analysis") or {},
            "sast": analysis_results.get("javascript_analysis") or {},
            "virustotal": analysis_results.get("virustotal_analysis") or {},
            "entropy": analysis_results.get("entropy_analysis") or {},
            "gates_triggered": gate_summaries,
            "capability_flags": capability_flags,
            "external_domains": external_domains,
            "network_evidence": network_evidence,
            "extension": {
                "name": (
                    (manifest or {}).get("name")
                    or metadata.get("title")
                    or metadata.get("name")
                    or extension_id
                ),
                "version": (manifest or {}).get("version") or metadata.get("version"),
                "user_count": metadata.get("user_count")
                or metadata.get("users")
                or (signal_pack.webstore_stats.installs if signal_pack else None),
                "rating": metadata.get("rating")
                or metadata.get("avg_rating")
                or (analysis_results.get("webstore_analysis") or {}).get("rating"),
            },
        }

        return facts_pack, score, score_label, host_scope_label

    def _get_summary_rewrite_prompt_template(
        self,
        facts_pack: Dict[str, Any],
        draft_summary: Dict[str, Any],
    ) -> Optional[PromptTemplate]:
        """Create prompt template for summary_rewrite, if available."""
        templates = get_prompts("summary_generation")
        template_str = templates.get("summary_rewrite")
        if not template_str:
            return None

        facts_pack_json = self._json_block(facts_pack)
        draft_summary_json = self._json_block(draft_summary)

        template = PromptTemplate(
            input_variables=["facts_pack_json", "draft_summary_json"],
            template=template_str,
            template_format="jinja2",
        ).partial(
            facts_pack_json=facts_pack_json,
            draft_summary_json=draft_summary_json,
        )

        return template

    def _get_summary_prompt_template(
        self,
        analysis_results: Dict,
        manifest: Dict,
        metadata: Optional[Dict],
        scan_id: Optional[str],
        extension_id: Optional[str],
    ) -> PromptTemplate:
        """Create prompt template for summary generation."""
        template_str = get_prompts("summary_generation")
        template_str = template_str.get("summary_generation")

        if not template_str:
            raise ValueError("Summary generation prompt template not found")

        score, score_label = self._compute_score_context(
            analysis_results=analysis_results,
            manifest=manifest,
            metadata=metadata,
            scan_id=scan_id,
            extension_id=extension_id,
        )

        manifest_json = self._json_block(manifest)
        permissions_summary_json = self._json_block(analysis_results.get("permissions_analysis"))
        webstore_result_json = self._json_block(analysis_results.get("webstore_analysis"))
        sast_result_json = self._json_block(analysis_results.get("javascript_analysis"))
        
        # Classify host access scope
        host_access_summary = self._classify_host_access_scope(manifest)
        host_access_summary_json = self._json_block(host_access_summary)

        template = PromptTemplate(
            input_variables=[
                "score",
                "score_label",
                "host_access_summary_json",
                "manifest_json",
                "permissions_summary_json",
                "webstore_result_json",
                "sast_result_json",
            ],
            template=template_str,
            template_format="jinja2",
        ).partial(
            score=score,
            score_label=score_label,
            host_access_summary_json=host_access_summary_json,
            manifest_json=manifest_json,
            permissions_summary_json=permissions_summary_json,
            webstore_result_json=webstore_result_json,
            sast_result_json=sast_result_json,
        )

        return template

    def generate(
        self,
        analysis_results: Dict,
        manifest: Dict,
        metadata: Optional[Dict] = None,
        scan_id: Optional[str] = None,
        extension_id: Optional[str] = None,
    ) -> Optional[Dict]:
        """
        Generate executive summary from all analysis results.

        Args:
            analysis_results: Dict containing results from all analyzers
            manifest: Parsed manifest.json data
            metadata: Extension metadata (optional)
            scan_id: Scan identifier for scoring context (optional)
            extension_id: Extension ID for scoring context (optional)

        Returns:
            Dict with executive summary including:
                - overall_risk_level: "low" | "medium" | "high"
                - summary: Executive summary text
                - key_findings: List of critical findings
                - recommendations: List of actionable recommendations
        """
        if not analysis_results:
            logger.warning("No analysis results provided for summary generation")
            return None

        if not manifest:
            logger.warning("No manifest data provided for summary generation")
            return None

        prompt = None
        facts_score = None
        facts_score_label = None
        facts_host_scope_label = None

        # Prefer summary_rewrite prompt if available (facts pack + draft fallback)
        try:
            facts_pack, facts_score, facts_score_label, facts_host_scope_label = self._build_facts_pack(
                analysis_results=analysis_results,
                manifest=manifest,
                metadata=metadata,
                scan_id=scan_id,
                extension_id=extension_id,
            )
            from extension_shield.core.report_view_model import _fallback_executive_summary
            draft_summary = _fallback_executive_summary(
                score=facts_score,
                score_label=facts_score_label,
                host_scope_label=facts_host_scope_label,
            )
            prompt = self._get_summary_rewrite_prompt_template(
                facts_pack=facts_pack,
                draft_summary=draft_summary,
            )
        except Exception as exc:
            logger.warning("Failed to build summary_rewrite prompt; falling back: %s", exc)

        if prompt is None:
            prompt = self._get_summary_prompt_template(
                analysis_results=analysis_results,
                manifest=manifest,
                metadata=metadata,
                scan_id=scan_id,
                extension_id=extension_id,
            )
        # Use OpenAI 4-1 (gpt-4o) for better summary generation
        model_name = os.getenv("LLM_MODEL", "gpt-4o")
        model_parameters = {
            "temperature": 0.3,  # Slightly higher for more natural language
            "max_tokens": 4096,
        }

        try:
            # Format prompt to messages
            formatted_prompt = prompt.format_prompt()
            messages = formatted_prompt.to_messages()

            # Invoke with fallback
            response = invoke_with_fallback(
                messages=messages,
                model_name=model_name,
                model_parameters=model_parameters,
            )
            resolved_model_version = _extract_response_model_version(response)

            # Parse JSON response
            parser = JsonOutputParser()
            summary = parser.parse(response.content if hasattr(response, "content") else str(response))
            if isinstance(summary, dict):
                summary = _attach_model_version(summary, resolved_model_version)
                score = summary.get("score")
                score_label = summary.get("score_label")
                if score is None:
                    if facts_score is not None and facts_score_label is not None:
                        score = facts_score
                        score_label = facts_score_label
                    else:
                        score, score_label = self._compute_score_context(
                            analysis_results=analysis_results,
                            manifest=manifest,
                            metadata=metadata,
                            scan_id=scan_id,
                            extension_id=extension_id,
                        )
                    summary["score"] = score
                    summary["score_label"] = score_label

                summary.setdefault("summary", summary.get("one_liner"))
                summary.setdefault("key_findings", summary.get("why_this_score", []))
                summary.setdefault("recommendations", summary.get("what_to_watch", []))
                summary.setdefault(
                    "overall_risk_level",
                    self._normalize_label_to_level(summary.get("score_label", "")),
                )
                summary.setdefault("overall_security_score", summary.get("score", 0))
                
                # Validate against authoritative signals
                host_access_summary = self._classify_host_access_scope(manifest)
                host_scope_label = host_access_summary.get("host_scope_label", "UNKNOWN")
                
                # Compute capability flags for validation
                impact_analyzer = ImpactAnalyzer()
                external_domains = impact_analyzer._extract_external_domains(analysis_results)
                network_evidence = ImpactAnalyzer._extract_network_evidence_from_sast(
                    analysis_results.get("javascript_analysis")
                )
                capability_flags = impact_analyzer._compute_capability_flags(
                    manifest=manifest,
                    analysis_results=analysis_results,
                    host_access_summary=host_access_summary,
                    external_domains=external_domains,
                    network_evidence=network_evidence,
                )
                
                validation = validate_summary(
                    output=summary,
                    score_label=score_label,
                    host_scope_label=host_scope_label,
                    capability_flags=capability_flags,
                )
                
                # Check for generic filler
                if validation.ok:
                    generic_validation = validate_summary_not_generic(summary)
                    if not generic_validation.ok:
                        validation = generic_validation
                
                if not validation.ok:
                    # logger.warning(
                    #     "LLM summary validation failed, using fallback. Reasons: %s",
                    #     "; ".join(validation.reasons),
                    # )
                    # Return deterministic fallback
                    from extension_shield.core.report_view_model import _fallback_executive_summary
                    return _attach_model_version(
                        _fallback_executive_summary(
                            score=score,
                            score_label=score_label,
                            host_scope_label=host_scope_label,
                        ),
                        resolved_model_version,
                    )

                # ── Post-LLM sanity check: one_liner must not contradict score_label ──
                # Check BOTH keys: new format uses "one_liner", old format uses "summary"
                one_liner = summary.get("one_liner", "") or summary.get("summary", "")
                if _summary_contradicts_label(one_liner, score_label):
                    logger.warning(
                        "LLM one_liner contradicts score_label (%s). Discarding LLM summary.",
                        score_label,
                    )
                    from extension_shield.core.report_view_model import _fallback_executive_summary
                    return _attach_model_version(
                        _fallback_executive_summary(
                            score=score,
                            score_label=score_label,
                            host_scope_label=host_scope_label,
                        ),
                        resolved_model_version,
                    )

            logger.info("Executive summary generated successfully")
            return summary
        except Exception as exc:
            # Avoid noisy stack traces in normal operation; callers can decide how to handle None.
            logger.warning("Failed to generate executive summary: %s", exc)
            return None
