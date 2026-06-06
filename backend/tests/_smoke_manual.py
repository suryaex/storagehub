"""Manual end-to-end smoke test (run directly, not via pytest collection name).

Sets up a temporary SQLite DB + storage dir, then drives the real API through
TestClient: local login -> folder -> upload -> dashboard -> share -> search -> admin.
"""
import os
import sys
import tempfile

_tmp = tempfile.mkdtemp(prefix="sh_smoke_")
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + os.path.join(_tmp, "db.sqlite").replace(os.sep, "/")
os.environ["STORAGE_ROOT"] = os.path.join(_tmp, "storage")
os.environ.setdefault("SECRET_KEY", "smoke")
os.environ["ALLOW_LOCAL_LOGIN"] = "true"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
import app.main as m  # noqa: E402


def run() -> None:
    # `with` triggers the startup lifespan (init_db -> create_all), exactly like uvicorn.
    with TestClient(m.app) as c:
        _drive(c)


def _drive(c: TestClient) -> None:
    r = c.post("/api/v1/auth/local", json={"email": "surya@example.com", "full_name": "Surya"})
    assert r.status_code == 200, r.text
    tok = r.json()["data"]["access_token"]
    H = {"Authorization": f"Bearer {tok}"}

    me_resp = c.get("/api/v1/auth/me", headers=H)
    assert me_resp.status_code == 200, f"/auth/me -> {me_resp.status_code}: {me_resp.text}"
    me = me_resp.json()["data"]
    assert me["role"] == "admin", "first user should be admin"
    print("user:", me["email"], "role:", me["role"])

    root = c.get("/api/v1/folders/root/contents", headers=H).json()["data"]
    rid = root["folder"]["id"]

    f = c.post("/api/v1/folders", headers=H, json={"name": "Firmware", "parent_id": rid}).json()["data"]
    print("folder:", f["name"], f["id"])

    up = c.post(
        "/api/v1/files/upload", headers=H,
        files={"file": ("notes.md", b"# hello storagehub", "text/markdown")},
        data={"folder_id": str(f["id"])},
    )
    assert up.status_code == 200, up.text
    fid = up.json()["data"]["id"]
    print("uploaded file:", fid, "size:", up.json()["data"]["size_bytes"])

    dash = c.get("/api/v1/dashboard/summary", headers=H).json()["data"]
    print("dashboard used:", dash["storage_usage"]["used_bytes"], "files:", dash["file_count"])
    assert dash["file_count"] == 1

    sh = c.post("/api/v1/shares", headers=H, json={"file_id": fid}).json()["data"]
    print("share token:", sh["token"])
    pub = c.get(f"/api/v1/share/{sh['token']}").json()["data"]
    print("public share:", pub["type"], pub["name"])
    assert pub["name"] == "notes.md"

    s = c.get("/api/v1/search", headers=H, params={"q": "notes"}).json()["data"]
    print("search files:", len(s["files"]))
    assert len(s["files"]) == 1

    ov = c.get("/api/v1/admin/overview", headers=H).json()["data"]
    print("admin users:", ov["total_users"], "files:", ov["total_files"])

    # chunked upload session
    sess = c.post("/api/v1/uploads/sessions", headers=H, json={
        "folder_id": f["id"], "file_name": "big.bin", "size_bytes": 10,
        "chunk_size_bytes": 4,
    }).json()["data"]
    total = sess["total_chunks"]
    blob = b"0123456789"
    cs = sess["chunk_size_bytes"]
    for i in range(total):
        c.post(f"/api/v1/uploads/sessions/{sess['session_id']}/chunks/{i}", headers=H,
               content=blob[i * cs:(i + 1) * cs])
    done = c.post(f"/api/v1/uploads/sessions/{sess['session_id']}/complete", headers=H)
    assert done.status_code == 200, done.text
    print("chunked upload file:", done.json()["data"]["filename"], done.json()["data"]["size_bytes"])

    print("SMOKE OK")


if __name__ == "__main__":
    run()
