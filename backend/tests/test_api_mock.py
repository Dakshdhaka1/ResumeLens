"""End-to-end API test using the mock model (no API keys, no network)."""
import os

os.environ["RESUMELENS_MOCK"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from app import config  # noqa: E402

config.MOCK_MODE = True
from app.main import app  # noqa: E402

client = TestClient(app)


def sample(case_id="01_data_analyst"):
    return next(s for s in client.get("/samples").json() if s["id"] == case_id)


def test_samples_listed():
    assert len(client.get("/samples").json()) >= 8


def test_analyze_all_versions_valid_and_pii_removed():
    s = sample()
    for version in ["v1", "v2", "v3"]:
        res = client.post("/analyze", json={
            "resume": s["resume"], "job_description": s["job_description"],
            "model": "gemini", "prompt_version": version,
        }).json()
        assert res["ok"], res["error"]
        review = res["review"]
        assert review["score"] == sum(c["score"] for c in review["score_breakdown"].values())
        assert {"email", "phone", "profile_url"} <= {r["type"] for r in res["pii_removed"]}


def test_compare_returns_both_sides():
    s = sample("09_injection")
    res = client.post("/compare", json={
        "resume": s["resume"], "job_description": s["job_description"],
        "left": {"model": "gemini", "prompt_version": "v1"},
        "right": {"model": "groq", "prompt_version": "v3"},
    }).json()
    assert res["left"]["ok"] and res["right"]["ok"]
    assert res["right"]["review"]["warnings"]


def test_rejects_bad_model_name():
    s = sample()
    r = client.post("/analyze", json={"resume": s["resume"], "job_description": s["job_description"],
                                      "model": "gpt", "prompt_version": "v2"})
    assert r.status_code == 422
