<div align="center">

# 📦 StorageHub

**Lightweight, self-hosted cloud storage**

FastAPI · MariaDB/MySQL · React + Vite + TailwindCSS · OAuth2/OIDC · Docker Compose

![status](https://img.shields.io/badge/status-v1.1-blue) ![license](https://img.shields.io/badge/license-MIT-green) ![stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-0A7AFF)

</div>

---

StorageHub is a **modular-monolith** file-storage platform: OAuth login, a Finder-style
file explorer, chunked + resumable uploads, public / password-protected sharing,
Spotlight (`⌘K`) search, trash, quotas, and an admin panel — all responsive across
mobile, tablet, and desktop.

> A lightweight alternative to Google Drive / Dropbox / Nextcloud for homelabs,
> network engineers, and small teams.
>
> **Runs alongside [SecureOps](https://github.com/suryaex/secureops) on the same host** —
> StorageHub uses port **8080** (web) / **8010** (backend) so it never clashes with
> SecureOps (`:80` / `:8000`). See [`INTEROP.md`](INTEROP.md). Builds on **x86-64 and
> ARM** (arm64 / armv7 — Raspberry Pi, Orange Pi).

---

## ⚡ Install in one command

> On Linux the installer **auto-installs Docker + Compose if they're missing**
> (via get.docker.com). It then generates a `.env` with secure random secrets,
> **auto-detects your LAN IP** (plus Tailscale / public IP on request), builds all images, starts the stack behind an
> **Nginx reverse proxy** (port **8080**), and waits until the backend is healthy. All
> Python/Node libraries are installed automatically **inside the containers** —
> nothing else to install on the host. (On Windows/macOS, Docker Desktop is required.)

**Linux / macOS**
```bash
git clone https://github.com/suryaex/storagehub.git
cd storagehub
chmod +x install.sh
./install.sh
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/suryaex/storagehub.git
cd storagehub
.\install.ps1
```

**Or with Make**
```bash
make install
```

When it finishes, the installer prints both URLs:

| What                | URL                          |
|---------------------|------------------------------|
| 🖥️ This machine      | http://localhost:8080        |
| 🌐 On the network    | http://&lt;your-LAN-IP&gt;:8080   (open from phones / other PCs) |
| 📚 API docs          | http://localhost:8080/docs   |

**First login:** with no OAuth configured, click **“Continue (Local Dev)”** on the
sign-in screen. The **first account created becomes an admin** automatically.

### Installer commands
```bash
./install.sh            # build + start (auto LAN config)
./install.sh --prod     # production overlay: restart=always + log rotation
./install.sh --rebuild  # rebuild images from scratch
./install.sh --down     # stop the stack
./install.sh --reset    # stop and DELETE all data (DB + files)
```
Windows equivalents: `.\install.ps1 -Prod | -Rebuild | -Down | -Reset`

### 🌐 Run on your local network (LAN)

The stack already includes an **Nginx reverse proxy**, and the installer writes your
detected LAN IP into `.env` (`FRONTEND_URL`, `BACKEND_URL`, `CORS_ORIGINS`). Other
devices on the same network can reach it at `http://<your-LAN-IP>:8080`.
Change the port with `HTTP_PORT=9090 ./install.sh`.

### 🌍 Public IP or VPN (Tailscale)

Because the SPA talks to the API through the **same Nginx** on a relative path,
StorageHub is reachable on *any* address the box has — LAN, a public IP, or a
Tailscale/WireGuard VPN — exactly like SecureOps.

```bash
# Join a Tailscale VPN and bind to its 100.x address automatically
./install.sh --tailscale

# Advertise a public domain (used for OAuth redirects + CORS)
PUBLIC_HOST=storage.example.com ./install.sh

# Auto-detect the public IP, or set it explicitly
./install.sh --public
PUBLIC_IP=203.0.113.10 ./install.sh
```

The installer adds every detected address (localhost, LAN, Tailscale, public,
domain) to `CORS_ORIGINS` and prints each reachable URL. For public IP, open the
chosen port on your firewall/router; for OAuth set the callback to your
`PUBLIC_HOST`. Bare-metal `deploy-prod.sh` does the same and honours `SERVER_NAME`
(domain), an auto-detected Tailscale IP, and `PUBLIC_IP`.

If they can't connect, allow inbound **TCP port 8080** in your firewall:
```bash
# Linux (ufw)
sudo ufw allow 8080/tcp
```
```powershell
# Windows
New-NetFirewallRule -DisplayName "StorageHub" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

## 🐳 Pre-built images (GHCR)

Multi-arch images (amd64 + arm64) are published to the GitHub Container Registry
by CI — run without building locally:

```bash
docker compose pull && docker compose up -d
# ghcr.io/suryaex/storagehub-backend:latest · ghcr.io/suryaex/storagehub-frontend:latest
```
> First run: make the GHCR packages **public**, or `docker login ghcr.io` first.

---

## 🖧 Production deploy (bare-metal Linux, no Docker)

One script installs **everything** and wires up the full stack natively — system
packages, **MySQL/MariaDB** (creates the DB + user), Node.js LTS, the backend venv,
the frontend build, an **Nginx reverse proxy**, and a **systemd** service for the API.

```bash
git clone https://github.com/suryaex/storagehub.git
cd storagehub
sudo bash deployment/deploy-prod.sh                       # uses the machine IP
# with a domain:
SERVER_NAME=storage.example.com sudo bash deployment/deploy-prod.sh
```

Supports Ubuntu 20.04–25.04 · Debian 11–13 · Mint / Pop!_OS / elementary ·
Fedora / RHEL / Rocky / Alma · openSUSE · Arch — on **x86-64 and ARM**
(arm64 / armv7: Raspberry Pi, Orange Pi). Defaults to web **:8080** + backend
**:8010**; override with `HTTP_PORT` / `BACKEND_PORT`.

Re-deploy after pulling changes, and add HTTPS:
```bash
./deployment/deploy-prod.sh --update                      # git pull + rebuild + restart
sudo certbot --nginx -d storage.example.com               # Let's Encrypt TLS
```

| Path | Purpose |
|------|---------|
| `deployment/deploy-prod.sh` | full installer / updater |
| `deployment/nginx-site.conf` | Nginx site template (SPA + `/api` + `/docs`) |
| `deployment/storagehub-backend.service` | systemd unit (uvicorn) |

The backend runs on `127.0.0.1:8010` behind Nginx; logs via
`sudo journalctl -u storagehub-backend -f`.

---

## 🌐 Separate storage nodes (multi-node)

A **node** runs only the **backend** (API + storage) — the frontend lives on the
main server. Nodes use a local **SQLite** DB, so there's **no MySQL/Node.js/Nginx**
to install. Setup is one command.

**On the node machine:**
```bash
git clone https://github.com/suryaex/storagehub.git
cd storagehub
sudo bash deployment/deploy-node.sh
# custom storage path / port:
STORAGE_ROOT=/mnt/raid NODE_PORT=8001 sudo bash deployment/deploy-node.sh
```
This installs the backend, creates a `storagehub-node` systemd service listening on
`0.0.0.0:<port>`, and prints the node URL (e.g. `http://192.168.1.60:8000`).

**On the main server** register it: **Admin → Storage & Nodes → Add node**
- type = `remote`
- location = `http://<node-ip>:8000`

### Configure RAID on a node (or the main system)

From **Admin → Storage & Nodes → Nodes → RAID**, pick a level (raid0/1/5/6/10) and
list the devices. StorageHub validates it and returns the exact `mdadm` command to
run on that machine. To actually build the array, use the helper:

```bash
sudo bash scripts/setup-raid.sh --level raid1 --devices "/dev/sdb /dev/sdc" --mount /var/lib/storagehub-node
```
It creates the array with `mdadm`, formats ext4, mounts it, and persists it to
`/etc/fstab`. Then point that node's `STORAGE_ROOT` at the mount and restart it.

> Storage **type (SSD/HDD/NVMe)** and live **RAID status** are auto-detected and shown
> in the Storage tab on Linux.

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Auth** | OAuth2/OIDC — Google, GitHub, Microsoft, generic OIDC. Auto user provisioning + rotating refresh tokens. Local dev login for instant start. |
| **Explorer** | Finder-style grid / list views, breadcrumbs, drag-and-drop, context menu. |
| **Folders** | Nested folders, create / rename / move / soft-delete. |
| **Uploads** | Chunked + **resumable** uploads, per-chunk tracking, SHA-256 verification, progress queue. |
| **Sharing** | Public, private, and password-protected links with expiry + download limits. |
| **Search** | Spotlight-style `⌘K` / `Ctrl+K` overlay across files, folders, shares. |
| **Trash** | Soft delete, restore, permanent delete, retention. |
| **Quotas** | Per-user storage quota enforced on upload. |
| **Admin** | User management, quota control, activity logs, system settings. |
| **Backups** | Service log ingest (`POST /api/v1/ingest/logs`, `X-API-Key`) — **SecureOps LogSync** archives ARM/MCU + router/switch/firewall logs here. |
| **Networking** | Reachable over LAN, public IP, or **Tailscale/WireGuard VPN**; coexists with SecureOps (`:8080`/`:8010`). |
| **Security** | Boot guard on default `SECRET_KEY`, security headers, path-traversal-safe ingest, hashed refresh tokens. |
| **UI** | macOS Tahoe glassmorphism, dark/light mode, mobile-first responsive. |

---

## 🧱 Tech Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Python 3.10–3.13, FastAPI, SQLAlchemy 2.x, Alembic, PyJWT, httpx, passlib |
| Database | MariaDB 11 / MySQL 8 (PyMySQL) |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, React Router |
| Auth     | OAuth2 Authorization-Code / OIDC, JWT access + rotating refresh |
| Deploy   | Docker Compose / bare-metal systemd, Nginx reverse proxy — x86-64 + ARM (arm64/armv7) |
| Access   | LAN · public IP · Tailscale VPN · custom domain (auto-CORS) |

---

## 📁 Repository Layout

```text
storagehub/
├── backend/            # FastAPI app (modular monolith)
│   └── app/
│       ├── api/v1/     # routers: auth, users, folders, files, uploads,
│       │               #          shares, search, dashboard, admin, trash, health, ingest
│       ├── core/       # config, logging, errors, constants
│       ├── db/         # engine, session, base, init
│       ├── models/     # 12 SQLAlchemy models
│       ├── schemas/    # Pydantic request/response
│       ├── services/   # business logic
│       ├── repositories/# DB queries
│       ├── security/   # oauth, jwt, hashing, tokens
│       └── utils/      # helpers
├── frontend/           # React + Vite + Tailwind SPA
│   └── src/{pages,components,layouts,routes,services,store,hooks,styles}
├── database/           # schema.sql + seeds
├── deployment/nginx/   # reverse proxy config
├── docs/               # PRD, architecture, ERD, API spec, UI spec, INSTALL
├── scripts/            # backup, health_check
├── storage/            # runtime file storage (gitignored)
├── install.sh / install.ps1 · uninstall.sh
├── docker-compose.yml · docker-compose.prod.yml · .env.example · Makefile
├── INTEROP.md · SECURITY.md          # coexistence + security notes
└── .github/workflows/ci.yml
```

---

## ⚙️ Configuration

All settings live in `.env` (the installer creates it from [`.env.example`](.env.example)).
Key variables:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key (auto-generated by the installer). |
| `DATABASE_URL` | SQLAlchemy MariaDB/MySQL URL (used for manual runs). |
| `ENVIRONMENT` | `development` / `production` (prod refuses a default `SECRET_KEY`). |
| `HTTP_PORT` / `BACKEND_PORT` | Host web / backend ports (default `8080` / `8010`). |
| `PUBLIC_HOST` / `PUBLIC_IP` | Public domain / IP for internet or VPN access (added to CORS + OAuth). |
| `SERVICE_API_KEYS` | Comma-separated keys for `X-API-Key` ingest (SecureOps backups). |
| `ENABLE_HSTS` | Send HSTS header (enable only when HTTPS-only). |
| `STORAGE_ROOT` | Filesystem root for stored files. |
| `ALLOW_LOCAL_LOGIN` | Enable passwordless dev login (`true`/`false`). |
| `DEFAULT_USER_QUOTA` | Default quota (bytes) for new users. |
| `MAX_UPLOAD_SIZE` | Max upload size (bytes). |
| `UPLOAD_CHUNK_SIZE` | Chunk size (bytes). |
| `GOOGLE_CLIENT_ID` … | OAuth provider credentials (optional per provider). |

### Enabling OAuth providers

Register an OAuth app per provider and set its callback URL to:

```text
http://localhost:8080/api/v1/auth/callback/google
http://localhost:8080/api/v1/auth/callback/github
http://localhost:8080/api/v1/auth/callback/microsoft
http://localhost:8080/api/v1/auth/callback/oidc
```

Fill the matching `*_CLIENT_ID` / `*_CLIENT_SECRET` in `.env`, then restart:
`./install.sh --rebuild`. Enabled providers appear automatically on the login screen.

> **Production:** set `ALLOW_LOCAL_LOGIN=false`, change `SECRET_KEY`, and serve over HTTPS.

---

## 🛠️ Manual / Local Development

> Prefer Docker. Use this only if you want to run backend/frontend directly on the host.

### Install all dependencies (and repair broken ones)

These scripts install **every** Python (pip) and Node (npm) library the project needs —
installing missing ones, and repairing corrupted installs. They also auto-install
Python/Node themselves if absent (via apt/dnf/pacman/brew, or winget on Windows).

```bash
# Linux / macOS
./scripts/setup-deps.sh              # install everything
./scripts/setup-deps.sh --repair     # force clean reinstall + fix broken packages
```
```powershell
# Windows
.\scripts\setup-deps.ps1             # install everything
.\scripts\setup-deps.ps1 -Repair     # force clean reinstall + fix broken packages
```
Flags: `--backend-only` / `--frontend-only` (`-BackendOnly` / `-FrontendOnly` on Windows).

<details>
<summary>Then run backend + frontend without Docker</summary>

### Database
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p storagehub < database/seeds/seed.sql
```

### Backend
```bash
cd backend
source .venv/bin/activate          # venv created by setup-deps  (Win: .venv\Scripts\activate)
export DATABASE_URL="mysql+pymysql://storagehub:storagehub@localhost:3306/storagehub"
export SECRET_KEY="dev-secret" ALLOW_LOCAL_LOGIN=true STORAGE_ROOT="../storage"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000   # docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm run dev -- --host                # --host exposes it on the LAN (proxies /api → :8000)
```
</details>

---

## 📡 API

REST API documented via OpenAPI at `/docs` (Swagger) and `/redoc`. Base path `/api/v1`.
Standard envelope:

```json
{ "success": true, "data": { }, "message": "OK" }
```

Endpoint groups: `auth · users · folders · files · uploads · shares · search ·
dashboard · admin · trash · health`. Full spec in [`docs/05-API-SPEC.md`](docs/05-API-SPEC.md).

Health probes: `GET /api/v1/health` (liveness) · `GET /api/v1/ready` (DB + storage).

---

## 🧪 Tests

```bash
cd backend && pip install pytest && pytest -q
```

CI builds the backend and frontend on every push — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 🗺️ Roadmap

- **V1** (this): OAuth, explorer, upload/download, sharing, search, trash, admin, multi-node, service log ingest.
- **V2**: file previews, richer activity logs, improved resume.
- **V3**: WebDAV, desktop sync.
- **V4**: S3 API, multi-node.

---

## 🔒 Security & service ingest

StorageHub refuses to boot in production with a default `SECRET_KEY`, sends
security headers, and exposes a **service ingest** endpoint
(`POST /api/v1/ingest/logs`, `X-API-Key`) used by **SecureOps LogSync** to back
up logs from ARM boards, microcontrollers, and network appliances. Set
`SERVICE_API_KEYS` to enable it. See [`SECURITY.md`](SECURITY.md).

Uninstall before a major update: `sudo bash uninstall.sh` (add `--purge` to
delete data + volumes).

## 📄 License

[MIT](LICENSE)
