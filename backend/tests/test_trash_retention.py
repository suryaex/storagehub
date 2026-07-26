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
from app.core.config import settings  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.file import File  # noqa: E402
from app.models.folder import Folder  # noqa: E402
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


def _create_folder(c: TestClient, h: dict, parent_id: int, name: str) -> int:
    r = c.post("/api/v1/folders", headers=h, json={"parent_id": parent_id, "name": name})
    assert r.status_code == 200, r.text
    return r.json()["data"]["id"]


def _blob_path(file_id: int) -> str:
    with SessionLocal() as db:
        f = db.get(File, file_id)
        return os.path.join(settings.STORAGE_ROOT, f.storage_path)


def test_purge_folder_deletes_child_blob_and_refunds_quota(client: TestClient):
    _set_retention(client, -1)
    h = _login(client, "retention-folder1@example.com")
    root_id = _root_folder(client, h)
    folder_id = _create_folder(client, h, root_id, "sub")
    file_id = _upload(client, h, folder_id, "child.txt", b"hello world")
    blob = _blob_path(file_id)
    assert os.path.exists(blob)

    del_resp = client.delete(f"/api/v1/folders/{folder_id}", headers=h)
    assert del_resp.status_code == 200, del_resp.text

    # Listing trash purges the expired folder (and its file) as a side effect.
    trash = client.get("/api/v1/trash", headers=h).json()["data"]
    assert trash == []

    assert not os.path.exists(blob)
    used_after = client.get("/api/v1/users/me", headers=h).json()["data"]["used_bytes"]
    assert used_after == 0
    assert client.get(f"/api/v1/files/{file_id}", headers=h).status_code == 404
    with SessionLocal() as db:
        assert db.get(Folder, folder_id) is None


def test_purge_nested_folder_deletes_all_descendant_blobs_and_quota(client: TestClient):
    _set_retention(client, -1)
    h = _login(client, "retention-folder2@example.com")
    root_id = _root_folder(client, h)
    parent_id = _create_folder(client, h, root_id, "parent")
    child_id = _create_folder(client, h, parent_id, "child")
    file_a = _upload(client, h, parent_id, "a.txt", b"in parent")
    file_b = _upload(client, h, child_id, "b.txt", b"in nested child")
    blob_a, blob_b = _blob_path(file_a), _blob_path(file_b)
    assert os.path.exists(blob_a) and os.path.exists(blob_b)

    client.delete(f"/api/v1/folders/{parent_id}", headers=h)
    trash = client.get("/api/v1/trash", headers=h).json()["data"]
    assert trash == []

    assert not os.path.exists(blob_a)
    assert not os.path.exists(blob_b)
    used_after = client.get("/api/v1/users/me", headers=h).json()["data"]["used_bytes"]
    assert used_after == 0
    with SessionLocal() as db:
        assert db.get(Folder, parent_id) is None
        assert db.get(Folder, child_id) is None


def test_purge_folder_survives_already_missing_blob(client: TestClient):
    _set_retention(client, -1)
    h = _login(client, "retention-folder3@example.com")
    root_id = _root_folder(client, h)
    folder_id = _create_folder(client, h, root_id, "sub")
    file_id = _upload(client, h, folder_id, "gone.txt", b"vanish")
    os.remove(_blob_path(file_id))  # simulate blob already lost on disk

    del_resp = client.delete(f"/api/v1/folders/{folder_id}", headers=h)
    assert del_resp.status_code == 200, del_resp.text

    trash = client.get("/api/v1/trash", headers=h).json()["data"]
    assert trash == []  # purge did not raise despite the missing blob
    used_after = client.get("/api/v1/users/me", headers=h).json()["data"]["used_bytes"]
    assert used_after == 0


def test_purge_does_not_touch_other_users_files(client: TestClient):
    _set_retention(client, -1)
    h1 = _login(client, "retention-owner1@example.com")
    h2 = _login(client, "retention-owner2@example.com")
    root2 = _root_folder(client, h2)
    other_file_id = _upload(client, h2, root2, "keep.txt", b"not yours")

    root1 = _root_folder(client, h1)
    folder_id = _create_folder(client, h1, root1, "sub")
    _upload(client, h1, folder_id, "mine.txt", b"delete me")
    client.delete(f"/api/v1/folders/{folder_id}", headers=h1)
    client.get("/api/v1/trash", headers=h1).json()["data"]  # triggers purge for user1 only

    detail = client.get(f"/api/v1/files/{other_file_id}", headers=h2)
    assert detail.status_code == 200
    used2 = client.get("/api/v1/users/me", headers=h2).json()["data"]["used_bytes"]
    assert used2 == len(b"not yours")


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
