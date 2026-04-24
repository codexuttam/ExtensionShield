from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from extension_shield.api.main import app, scan_results


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_feedback_persists_versions_from_scan_payload(client: TestClient) -> None:
    scan_id = "abcdefghijklmnopabcdefghijklmnop"
    scan_results.pop(scan_id, None)

    scan_payload = {
        "summary": {"model_version": "gpt-4o"},
        "scoring_v2": {"scoring_version": "2.0.0", "weights_version": "v1"},
    }

    with patch("extension_shield.api.main.db") as mock_db:
        mock_db.get_scan_result = MagicMock(return_value=scan_payload)
        mock_db.save_feedback = MagicMock()

        response = client.post(
            "/api/feedback",
            json={
                "scan_id": scan_id,
                "helpful": False,
                "reason": "score_off",
                "suggested_score": 72,
                "comment": "Score feels too strict",
            },
        )

    assert response.status_code == 200
    mock_db.save_feedback.assert_called_once_with(
        scan_id=scan_id,
        helpful=False,
        reason="score_off",
        suggested_score=72,
        comment="Score feels too strict",
        user_id=None,
        model_version="gpt-4o",
        ruleset_version="v1",
    )


def test_feedback_handles_missing_version_metadata(client: TestClient) -> None:
    scan_id = "ponmlkjihgfedcbaponmlkjihgfedcba"
    scan_results.pop(scan_id, None)

    with patch("extension_shield.api.main.db") as mock_db:
        mock_db.get_scan_result = MagicMock(return_value={"summary": {}, "scoring_v2": {}})
        mock_db.save_feedback = MagicMock()

        response = client.post(
            "/api/feedback",
            json={
                "scan_id": scan_id,
                "helpful": True,
            },
        )

    assert response.status_code == 200
    mock_db.save_feedback.assert_called_once_with(
        scan_id=scan_id,
        helpful=True,
        reason=None,
        suggested_score=None,
        comment=None,
        user_id=None,
        model_version=None,
        ruleset_version=None,
    )


def test_feedback_persists_versions_from_nested_summary_payload(
    client: TestClient,
) -> None:
    scan_id = "nestedabcdefghijnestedabcdefghij"
    scan_results.pop(scan_id, None)

    scan_payload = {
        "summary": {
            "report_view_model": {
                "meta": {
                    "model_version": "resolved-model",
                    "ruleset_version": "legacy-rules",
                }
            },
            "scoring_v2": {
                "scoring_version": "2.1.0",
                "weights_version": "rules-v3",
            },
        }
    }

    with patch("extension_shield.api.main.db") as mock_db:
        mock_db.get_scan_result = MagicMock(return_value=scan_payload)
        mock_db.save_feedback = MagicMock()

        response = client.post(
            "/api/feedback",
            json={
                "scan_id": scan_id,
                "helpful": False,
                "reason": "score_off",
                "suggested_score": 85,
                "comment": "Nested summary payload",
            },
        )

    assert response.status_code == 200
    mock_db.save_feedback.assert_called_once_with(
        scan_id=scan_id,
        helpful=False,
        reason="score_off",
        suggested_score=85,
        comment="Nested summary payload",
        user_id=None,
        model_version="resolved-model",
        ruleset_version="legacy-rules",
    )


def test_feedback_normalizes_anonymous_user_id_to_none(client: TestClient) -> None:
    scan_id = "anonabcdefghijklmnoanonabcdefgh"
    scan_results.pop(scan_id, None)

    scan_payload = {
        "summary": {"model_version": "gpt-4o-mini"},
        "scoring_v2": {"weights_version": "v1"},
    }

    with patch("extension_shield.api.main.db") as mock_db:
        mock_db.get_scan_result = MagicMock(return_value=scan_payload)
        mock_db.save_feedback = MagicMock()

        response = client.post(
            "/api/feedback",
            json={
                "scan_id": scan_id,
                "helpful": False,
                "reason": "other",
                "comment": "anonymous feedback",
            },
        )

    assert response.status_code == 200
    mock_db.save_feedback.assert_called_once_with(
        scan_id=scan_id,
        helpful=False,
        reason="other",
        suggested_score=None,
        comment="anonymous feedback",
        user_id=None,
        model_version="gpt-4o-mini",
        ruleset_version="v1",
    )
