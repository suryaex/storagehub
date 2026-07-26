"""Activity log audit trail: own-log endpoint, IDOR, admin-only global view,
login success/failure, and that key actions actually get logged.
"""
from __future__ import annotations

import os
import tempfile

import pytest

_tmp = tempfile.mkdtemp(prefix="sh_test_activitylog_")
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + os.path.join(_tmp, "db.sqlite").replace(os.sep, "/")
os.environ["STORAGE_ROOT"] = os.path.join(_tmp, "storage")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ["ALLOW_LOCAL_LOGIN"] = "true"

from fastapi.testclient import TestClient  # noqa: E402

import app.main as m  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(m.app) as c:
        yield c


def _login(c: TestClient, email: str) -> dict:
    r = c.post("/api/v1/auth/local", json={"email": email, "full_name": "Log Test"})
    assert r.status_code == 200, r.text
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _promote_admin(email: str) -> None:
    """Test files share one sqlite DB within a pytest run (the engine is
    bound at first `app.main` import), so "first user is admin" isn't a
    safe assumption across files — promote explicitly instead."""
    with SessionLocal() as db:
        db.query(User).filter_by(email=email).update({"role": "admin"})
        db.commit()


def _root_folder(c: TestClient, h: dict) -> int:
    root = c.get("/api/v1/folders/root/contents", headers=h).json()["data"]
    return root["folder"]["id"]


def _upload(c: TestClient, h: dict, folder_id: int, filename: str) -> int:
    up = c.post("/api/v1/files/upload", headers=h,
               files={"file": (filename, b"content", "text/plain")},
               data={"folder_id": str(folder_id)})
    assert up.status_code == 200, up.text
    return up.json()["data"]["id"]


def test_own_log_scoped_to_self_idor(client: TestClient):
    h_a = _login(client, "log-user-a@example.com")
    h_b = _login(client, "log-user-b@example.com")

    folder_a = _root_folder(client, h_a)
    _upload(client, h_a, folder_a, "a-file.txt")

    folder_b = _root_folder(client, h_b)
    _upload(client, h_b, folder_b, "b-file.txt")

    logs_a = client.get("/api/v1/users/me/activity-logs", headers=h_a).json()["data"]["items"]
    assert len(logs_a) >= 1
    assert all("b-file" not in str(item.get("resource_id", "")) for item in logs_a)

    # The client cannot smuggle another user's id in — the endpoint takes
    # no user_id param at all, forcing user.id server-side.
    logs_a_again = client.get("/api/v1/users/me/activity-logs",
                              headers=h_a, params={"user_id": 999}).json()["data"]["items"]
    assert logs_a == logs_a_again


def test_non_admin_cannot_read_global_activity_logs(client: TestClient):
    h = _login(client, "log-plain-user@example.com")
    resp = client.get("/api/v1/admin/activity-logs", headers=h)
    assert resp.status_code == 403


def test_upload_delete_restore_share_logged(client: TestClient):
    admin_h = _login(client, "log-admin3@example.com")
    _promote_admin("log-admin3@example.com")
    h = _login(client, "log-actor@example.com")
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "tracked.txt")

    client.delete(f"/api/v1/files/{file_id}", headers=h)
    client.post(f"/api/v1/files/{file_id}/restore", headers=h)
    client.post("/api/v1/shares", headers=h, json={"file_id": file_id})

    logs = client.get("/api/v1/users/me/activity-logs", headers=h, params={"limit": 50})
    actions = {item["action"] for item in logs.json()["data"]["items"]}
    assert {"upload_file", "delete_file", "restore_file", "share_created"} <= actions

    # Admin's global view can filter down to just this user too.
    admin_view = client.get("/api/v1/admin/activity-logs", headers=admin_h,
                            params={"limit": 50})
    assert admin_view.status_code == 200


def test_login_success_and_failure_logged(client: TestClient):
    admin_h = _login(client, "log-admin4@example.com")
    _promote_admin("log-admin4@example.com")
    h = _login(client, "log-disableme@example.com")  # noqa: F841 (login itself is the event under test)

    logs = client.get("/api/v1/users/me/activity-logs", headers=h).json()["data"]["items"]
    assert any(item["action"] == "login" for item in logs)

    # Find and disable that user via admin, then a further login attempt
    # must fail and be recorded as login_failed (visible to admin).
    users_list = client.get("/api/v1/admin/users", headers=admin_h,
                            params={"search": "log-disableme"}).json()["data"]["items"]
    target_id = users_list[0]["id"]
    disable_resp = client.post(f"/api/v1/users/{target_id}/disable", headers=admin_h)
    assert disable_resp.status_code == 200, disable_resp.text

    failed = client.post("/api/v1/auth/local",
                         json={"email": "log-disableme@example.com", "full_name": "x"})
    assert failed.status_code in (401, 403)

    admin_logs = client.get("/api/v1/admin/activity-logs", headers=admin_h,
                            params={"action": "login_failed", "limit": 50}).json()["data"]["items"]
    assert any(item["user_id"] == target_id for item in admin_logs)
