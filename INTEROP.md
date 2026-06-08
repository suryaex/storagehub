# StorageHub ⇄ SecureOps — Interoperability & Coexistence

StorageHub and SecureOps are designed to run **on the same host at the same time**
without colliding, and to share a compatible dependency baseline.

## Port map (no collisions)

| Service                     | Host port | Notes                                  |
|-----------------------------|-----------|----------------------------------------|
| **SecureOps** nginx (web)   | 80 / 443  | Primary — owns the public domain       |
| **SecureOps** backend       | 8000      | uvicorn/gunicorn (127.0.0.1)           |
| **SecureOps** agent         | 8001      | per monitored server                   |
| **StorageHub** nginx (web)  | **8080**  | `HTTP_PORT` env (default 8080)          |
| **StorageHub** backend      | **8010**  | `BACKEND_PORT` env (default 8010)       |
| **StorageHub** MariaDB      | 3306      | container/local only                   |

StorageHub now defaults to `:8080` (web) and `:8010` (backend) so it never fights
SecureOps for `:80`/`:8000`. Override with `HTTP_PORT` / `BACKEND_PORT`:

```bash
HTTP_PORT=9090 BACKEND_PORT=8011 bash deployment/deploy-prod.sh   # bare-metal
HTTP_PORT=9090 ./install.sh                                       # Docker
```

## Shared dependency baseline

Both backends pin the same compatible ranges (see `backend/requirements.txt`):

```
fastapi>=0.110,<1.0   uvicorn[standard]>=0.27,<1.0   SQLAlchemy>=2.0,<3.0
pydantic>=2.5,<3.0    passlib[bcrypt]>=1.7.4,<2.0     bcrypt>=4.0,<5.0
cryptography>=42.0,<45.0   httpx>=0.25,<1.0           python-multipart>=0.0.9,<1.0
```

Frontends share React 18 + Vite 5 + Tailwind 3.4 + axios 1.7.

## ARM (Raspberry Pi / Orange Pi)

Builds and runs on **arm64** and **armv7/armhf**:
- `deploy-prod.sh` detects `uname -m`; on armv7 it installs `cargo`/`rustc` so
  `cryptography` compiles, and caps the Vite build heap to avoid OOM.
- Backend Dockerfile installs `libffi-dev`/`libssl-dev` + `cargo`/`rustc` for the
  `cryptography` source build on 32-bit ARM.
- Docker DB is `mariadb:11` (multi-arch: arm64 **and** armv7), a drop-in for the
  previous `mysql:8.0` (which has no armv7 image). PyMySQL talks to it unchanged.
