import React from "react";
import { Link } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import CopyButton from "../../components/CopyButton";
import "./ApiServicePage.scss";

/**
 * API Service: easy reference for QA. URL-only flow, 3 steps, payload so they can test.
 */
const ApiServicePage = () => {
  const baseUrlExample = "https://extensionshield.com";
  const triggerBody = `{
  "url": "https://chromewebstore.google.com/detail/extension-name/abcdefghijklmnop..."
}`;
  const triggerResponse = `{
  "message": "Scan triggered successfully",
  "extension_id": "abcdefghijklmnop...",
  "status": "running"
}`;
  const resultsPayload = `{
  "extension_id": "string",
  "extension_name": "string",
  "status": "completed",
  "metadata": {},
  "permissions_analysis": { "risk_score", "permissions", "summary" },
  "sast_results": { "findings", "rules_triggered", "files_scanned", "summary" },
  "virustotal_analysis": { "enabled", "total_malicious", "total_suspicious", "summary" },
  "summary": {},
  "scoring_v2": { "overall_score", "layer_scores", "factors" },
  "risk_and_signals": {}
}`;

  return (
    <>
      <SEOHead
        title="API Service | ExtensionShield"
        description="ExtensionShield API: easy steps and payload reference for QA. URL trigger, status, results."
        pathname="/resources/api-service"
      />

      <div className="api-service-page">
        <div className="api-service-content">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Resources</span>
            <span>/</span>
            <span>API Service</span>
          </nav>

          <header className="api-service-header">
            <h1>API Service</h1>
            <p className="subtitle">
              API reference lives under <code>/api/...</code>. URL trigger → status → results. Payload below so you can test correctly.
            </p>
          </header>

          <section className="api-card basic-info">
            <h2>Basic API information</h2>
            <ul className="info-list info-list--compact">
              <li><strong>Base URL:</strong> Your origin (e.g. <code>{baseUrlExample}</code>). All API routes live under <code>/api/...</code>.</li>
              <li><strong>Content-Type:</strong> <code>application/json</code>.</li>
              <li><strong>Login:</strong> Not required. You can hit trigger, status, and results without signing in. Optional: sign in (e.g. Google) for higher daily scan limits.</li>
            </ul>
          </section>

          <section className="api-card steps-card">
            <h2>Easy steps</h2>
            <ol className="steps-list steps-list--simple">
              <li>
                <strong>1.</strong> <code>POST {baseUrlExample}/api/scan/trigger</code> with body <code>{"{ \"url\": \"<Chrome Web Store URL>\" }"}</code>. Copy <code>extension_id</code> from the response.
                <div className="pre-wrap pre-wrap--small">
                  <CopyButton text={triggerBody} />
                  <pre>{triggerBody}</pre>
                </div>
                <div className="pre-wrap pre-wrap--small">
                  <CopyButton text={triggerResponse} />
                  <pre>{triggerResponse}</pre>
                </div>
              </li>
              <li>
                <strong>2.</strong> <code>GET {baseUrlExample}/api/scan/status/{"<extension_id>"}</code> until <code>status</code> is <code>completed</code> (or <code>failed</code>).
              </li>
              <li>
                <strong>3.</strong> <code>GET {baseUrlExample}/api/scan/results/{"<extension_id>"}</code>. Response is the full scoring-engine payload (see below). Done.
              </li>
            </ol>
          </section>

          <section className="api-card payload-card">
            <h2>Payload: scoring engine result</h2>
            <p className="section-desc">What <code>GET /api/scan/results/{"{extension_id}"}</code> returns. Use this to verify your tests.</p>
            <div className="pre-wrap">
              <CopyButton text={resultsPayload} />
              <pre>{resultsPayload}</pre>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ApiServicePage;
