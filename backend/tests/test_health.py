"""Smoke tests for the health endpoints."""
from fastapi.testclient import TestClient


def _client():
    from app.main import app
    return TestClient(app)


def test_health_ok():
    resp = _client().get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["status"] == "ok"


def test_root():
    resp = _client().get("/")
    assert resp.status_code == 200
    assert resp.json()["data"]["service"] == "StorageHub"
