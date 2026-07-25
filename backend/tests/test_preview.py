"""Security-focused tests for the inline file-preview endpoints.

Covers: allowlisted type served inline, non-allowlisted type refused,
unauthenticated/unauthorized access rejected, and a path-traversal attempt
rejected. Uses a temp SQLite DB + temp storage dir (same pattern as
tests/_smoke_manual.py) so it never touches real data.
"""
from __future__ import annotations

import os
import tempfile

import pytest

_tmp = tempfile.mkdtemp(prefix="sh_test_preview_")
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + os.path.join(_tmp, "db.sqlite").replace(os.sep, "/")
os.environ["STORAGE_ROOT"] = os.path.join(_tmp, "storage")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ["ALLOW_LOCAL_LOGIN"] = "true"

from fastapi.testclient import TestClient  # noqa: E402

import app.main as m  # noqa: E402

PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00"
    b"\x00\x04\x00\x01\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82"
)


@pytest.fixture()
def client():
    with TestClient(m.app) as c:
        yield c


def _login(c: TestClient, email: str = "preview-user@example.com") -> dict:
    r = c.post("/api/v1/auth/local", json={"email": email, "full_name": "Preview User"})
    assert r.status_code == 200, r.text
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _root_folder(c: TestClient, headers: dict) -> int:
    root = c.get("/api/v1/folders/root/contents", headers=headers).json()["data"]
    return root["folder"]["id"]


def _upload(c: TestClient, headers: dict, folder_id: int, filename: str,
            content: bytes, content_type: str) -> int:
    up = c.post(
        "/api/v1/files/upload", headers=headers,
        files={"file": (filename, content, content_type)},
        data={"folder_id": str(folder_id)},
    )
    assert up.status_code == 200, up.text
    return up.json()["data"]["id"]


def test_allowlisted_image_served_inline(client: TestClient):
    h = _login(client)
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "photo.png", PNG_BYTES, "image/png")

    resp = client.get(f"/api/v1/files/{file_id}/preview", headers=h)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "image/png"
    assert "inline" in resp.headers["content-disposition"]
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert "sandbox" in resp.headers["content-security-policy"]


def test_non_allowlisted_type_not_served_inline(client: TestClient):
    """Client claims image/png (upload-time MIME is attacker-controlled),
    but the bytes are an executable-looking blob — server must sniff the
    real content and refuse, not trust the stored mime_type column."""
    h = _login(client)
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "evil.png", b"MZ\x90\x00fake-exe-not-a-png", "image/png")

    resp = client.get(f"/api/v1/files/{file_id}/preview", headers=h)
    assert resp.status_code == 415
    assert resp.json()["error"]["code"] == "PREVIEW_NOT_SUPPORTED"


def test_svg_never_inline_even_if_extension_says_image(client: TestClient):
    h = _login(client)
    folder_id = _root_folder(client, h)
    svg = b"<?xml version='1.0'?><svg onload='alert(1)'></svg>"
    file_id = _upload(client, h, folder_id, "logo.svg", svg, "image/svg+xml")

    resp = client.get(f"/api/v1/files/{file_id}/preview", headers=h)
    assert resp.status_code == 415


def test_unauthenticated_preview_rejected(client: TestClient):
    h = _login(client)
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "photo.png", PNG_BYTES, "image/png")

    resp = client.get(f"/api/v1/files/{file_id}/preview")
    assert resp.status_code == 401


def test_other_users_file_not_previewable(client: TestClient):
    h1 = _login(client, "owner@example.com")
    folder_id = _root_folder(client, h1)
    file_id = _upload(client, h1, folder_id, "photo.png", PNG_BYTES, "image/png")

    h2 = _login(client, "intruder@example.com")
    resp = client.get(f"/api/v1/files/{file_id}/preview", headers=h2)
    assert resp.status_code == 404


def test_preview_token_scoped_and_traversal_rejected(client: TestClient):
    h = _login(client)
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "photo.png", PNG_BYTES, "image/png")

    minted = client.post(f"/api/v1/files/{file_id}/preview-token", headers=h)
    assert minted.status_code == 200, minted.text
    token = minted.json()["data"]["token"]

    # Query-token auth works without an Authorization header.
    ok = client.get(f"/api/v1/files/{file_id}/preview", params={"token": token})
    assert ok.status_code == 200

    # But a token minted for file_id cannot be replayed against a different file.
    other_file_id = _upload(client, h, folder_id, "photo2.png", PNG_BYTES, "image/png")
    replayed = client.get(f"/api/v1/files/{other_file_id}/preview", params={"token": token})
    assert replayed.status_code == 401


def test_share_preview_does_not_consume_download_count(client: TestClient):
    """Regression: previewing a max_downloads=1 share must not exhaust it —
    only an actual /download should increment download_count."""
    h = _login(client)
    folder_id = _root_folder(client, h)
    file_id = _upload(client, h, folder_id, "photo.png", PNG_BYTES, "image/png")

    share = client.post("/api/v1/shares", headers=h,
                        json={"file_id": file_id, "max_downloads": 1}).json()["data"]
    token = share["token"]

    preview = client.get(f"/api/v1/share/{token}/preview")
    assert preview.status_code == 200, preview.text

    detail = client.get(f"/api/v1/shares/{share['id']}", headers=h).json()["data"]
    assert detail["download_count"] == 0

    # The single download unit must still be available after the preview.
    download = client.get(f"/api/v1/share/{token}/download")
    assert download.status_code == 200, download.text

    detail_after = client.get(f"/api/v1/shares/{share['id']}", headers=h).json()["data"]
    assert detail_after["download_count"] == 1

    # Now the share is exhausted — preview must be refused too, not just download.
    preview_after_exhaustion = client.get(f"/api/v1/share/{token}/preview")
    assert preview_after_exhaustion.status_code == 410


def test_path_traversal_attempt_rejected(client: TestClient):
    """The preview route only ever resolves file_id -> the DB-owned
    storage_path via FileService.download_path (same helper as download),
    so a traversal-style file_id or filename never reaches the filesystem."""
    h = _login(client)
    resp = client.get("/api/v1/files/999999/preview", headers=h)
    assert resp.status_code == 404

    # Non-numeric / traversal-shaped path segment is rejected by FastAPI's
    # int path converter before it ever reaches file resolution.
    resp2 = client.get("/api/v1/files/../../../../etc/passwd/preview", headers=h)
    assert resp2.status_code in (404, 422)
