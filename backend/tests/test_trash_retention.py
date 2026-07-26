"""Trash retention / auto-purge tests.

Purge is opportunistic (runs inside TrashService.list()/restore()), so the
end-to-end path is: set retention negative -> item is expired the instant
it's trashed -> next list/restore call purges it (blob + row + quota).
"""
from __future__ import annotations

import os
import tempfile

import pytest

_tmp = tempfile.mkdtemp(prefix="sh_test_retention_")
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + os.path.join(_tmp, "db.sqlite").replace(os.sep, "/")
os.environ["STORAGE_ROOT"] = os.path.join(_tmp, "storage")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ["ALLOW_LOCAL_LOGIN"] = "true"

from fastapi.testclient import TestClient  # noqa: E402

import app.main as m  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.trash_item import TrashItem  # noqa: E402
from app.models.user import User  # noqa: E402


@pytest.fixture()
def client():
    with TestClient(m.app) as c:
        yield c


def _login(c: TestClient, email: str) -> dict:
    r = c.post("/api/v1/auth/local", json={"email": email, "full_name": "Retention Test"})
    assert r.status_code == 200, r.text
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _set_retention(c: TestClient, days: int) -> None:
    """Test files share one sqlite DB within a pytest run (the engine is
    bound at first `app.main` import), so "first user is admin" isn't a
    safe assumption across files — promote explicitly instead."""
    admin_h = _login(c, "retention-admin@example.com")
    with SessionLocal() as db:
        db.query(User).filter_by(email="retention-admin@example.com").update({"role": "admin"})
        db.commit()
    r = c.patch("/api/v1/admin/settings", headers=admin_h, json={"trash_retention_days": days})
    assert r.status_code == 200, r.text


def _root_folder(c: TestClient, h: dict) -> int:
    root = c.get("/api/v1/folders/root/contents", headers=h).json()["data"]
    return root["folder"]["id"]


def _upload(c: TestClient, h: dict, folder_id: int, filename: str, content: bytes) -> int:
    up = c.post("/api/v1/files/upload", headers=h,
               files={"file": (filename, content, "text/plain")},
               data={"folder_id": str(folder_id)})
    assert up.status_code == 200, up.text
    return up.json()["data"]["id"]


def test_expired_trash_item_purged_on_list(client: TestClient):
    _set_retention(client, -1)
    h = _login(client, "retention-user1@example.com")
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "doc.txt", b"hello")

    used_before = client.get("/api/v1/users/me", headers=h).json()["data"]["used_bytes"]
    assert used_before == 5

    del_resp = client.delete(f"/api/v1/files/{file_id}", headers=h)
    assert del_resp.status_code == 200, del_resp.text

    # Listing trash purges the already-expired item as a side effect.
    trash = client.get("/api/v1/trash", headers=h).json()["data"]
    assert trash == []

    used_after = client.get("/api/v1/users/me", headers=h).json()["data"]["used_bytes"]
    assert used_after == 0

    # File row itself is gone, not just soft-deleted.
    detail = client.get(f"/api/v1/files/{file_id}", headers=h)
    assert detail.status_code == 404


def test_restore_after_expiry_purges_instead_of_reviving(client: TestClient):
    _set_retention(client, -1)
    h = _login(client, "retention-user2@example.com")
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "doc2.txt", b"bye")
    client.delete(f"/api/v1/files/{file_id}", headers=h)

    # Grab the trash row id without going through list() (which would purge
    # it first) so we can exercise the guard inside restore() itself.
    with SessionLocal() as db:
        item = db.query(TrashItem).filter_by(item_type="file", item_id=file_id).one()
        trash_id = item.id

    resp = client.post(f"/api/v1/trash/{trash_id}/restore", headers=h)
    assert resp.status_code == 404, resp.text


def test_restore_within_retention_still_works(client: TestClient):
    _set_retention(client, 30)
    h = _login(client, "retention-user3@example.com")
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "doc3.txt", b"keep")
    client.delete(f"/api/v1/files/{file_id}", headers=h)

    trash = client.get("/api/v1/trash", headers=h).json()["data"]
    assert len(trash) == 1
    trash_id = trash[0]["id"]

    resp = client.post(f"/api/v1/trash/{trash_id}/restore", headers=h)
    assert resp.status_code == 200, resp.text
    detail = client.get(f"/api/v1/files/{file_id}", headers=h)
    assert detail.status_code == 200
