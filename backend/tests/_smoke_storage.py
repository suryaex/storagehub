"""Manual smoke test for storage/nodes/cloud admin endpoints."""
import os
import sys
import tempfile

_tmp = tempfile.mkdtemp(prefix="sh_st_")
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///" + os.path.join(_tmp, "db.sqlite").replace(os.sep, "/")
os.environ["STORAGE_ROOT"] = os.path.join(_tmp, "storage")
os.environ.setdefault("SECRET_KEY", "smoke")
os.environ["ALLOW_LOCAL_LOGIN"] = "true"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402
import app.main as m  # noqa: E402


def run():
    with TestClient(m.app) as c:
        tok = c.post("/api/v1/auth/local", json={"email": "a@b.c", "full_name": "Admin"}).json()["data"]["access_token"]
        H = {"Authorization": f"Bearer {tok}"}

        ov = c.get("/api/v1/admin/storage", headers=H)
        assert ov.status_code == 200, ov.text
        host = ov.json()["data"]["host"]
        print("host platform:", host["platform"], "| media:", host["media"]["type"],
              "| total:", host["usage"]["total_bytes"], "| raid arrays:", len(host["raid"]))
        assert len(ov.json()["data"]["nodes"]) >= 1

        nodes = c.get("/api/v1/admin/nodes", headers=H).json()["data"]
        print("seeded nodes:", [(n["name"], n["is_primary"]) for n in nodes])
        assert any(n["is_primary"] for n in nodes)

        new = c.post("/api/v1/admin/nodes", headers=H, json={
            "name": "Node-2", "node_type": "local", "location": _tmp,
            "storage_type": "raid", "raid_level": "raid1",
        })
        assert new.status_code == 200, new.text
        nid = new.json()["data"]["id"]
        print("created node:", new.json()["data"]["name"], new.json()["data"]["raid_level"])

        upd = c.patch(f"/api/v1/admin/nodes/{nid}", headers=H, json={"raid_level": "raid5"})
        assert upd.json()["data"]["raid_level"] == "raid5", upd.text

        cl = c.post("/api/v1/admin/cloud-targets", headers=H, json={
            "name": "offsite-s3", "provider": "s3", "endpoint": "https://s3.example.com",
            "bucket": "backups", "access_key": "AKIA", "secret_key": "shh", "sync_mode": "backup",
        })
        assert cl.status_code == 200, cl.text
        assert "secret_key" not in cl.json()["data"], "secret must not be returned"
        print("cloud target:", cl.json()["data"]["name"], "secret hidden:", "secret_key" not in cl.json()["data"])

        clist = c.get("/api/v1/admin/cloud-targets", headers=H).json()["data"]
        print("cloud targets:", [t["name"] for t in clist])

        # RAID config: valid
        raid = c.post(f"/api/v1/admin/nodes/{nid}/raid", headers=H,
                      json={"raid_level": "raid1", "devices": ["/dev/sdb", "/dev/sdc"]})
        assert raid.status_code == 200, raid.text
        cmd = raid.json()["data"]["mdadm_command"]
        assert "mdadm --create" in cmd and "--level=1" in cmd, cmd
        print("raid cmd:", cmd)
        # RAID config: invalid (raid5 needs >=3)
        bad = c.post(f"/api/v1/admin/nodes/{nid}/raid", headers=H,
                     json={"raid_level": "raid5", "devices": ["/dev/sdb"]})
        assert bad.status_code == 422, f"expected 422, got {bad.status_code}"
        print("raid validation rejected bad config:", bad.json()["error"]["code"])

        c.delete(f"/api/v1/admin/nodes/{nid}", headers=H)
        print("STORAGE SMOKE OK")


if __name__ == "__main__":
    run()
