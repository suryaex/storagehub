<div align="center">

# StorageHub

**Self-hosted cloud storage — lightweight homelab alternative to Google Drive / Dropbox / Nextcloud**

*OAuth2/OIDC login · chunked uploads · Finder-style explorer · public sharing · multi-node storage*

![Version](https://img.shields.io/badge/version-1.0.4-brightgreen)
![License](https://img.shields.io/badge/license-Polsri%20Internal-blue)
![Stack](https://img.shields.io/badge/stack-FastAPI%20%2B%20React-0A7AFF)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![React](https://img.shields.io/badge/react-18-61dafb)

**Politeknik Negeri Sriwijaya · D4 Teknik Telekomunikasi**  
Pengembang: **Muhammad Surya Ragasin** · Bagian dari sistem **SecureOps + StorageHub**

</div>

---

Modular-monolith file-storage platform: OAuth login, Finder-style file explorer, chunked + resumable uploads, public / password-protected sharing, Spotlight (`⌘K`) search, trash, quotas, and an admin panel — all responsive across mobile, tablet, and desktop.

Runs **alongside [SecureOps](https://github.com/suryaex/secureops) on the same host** — StorageHub uses port **8080** (web) / **8010** (backend) so it never clashes with SecureOps (`:80` / `:8000`). See [`INTEROP.md`](INTEROP.md). Builds on x86-64 and ARM (arm64 / armv7).

---

## Installation

**Prerequisites:** Git + Docker & Docker Compose. On **Linux** the installer auto-installs Docker if missing; on **Windows/macOS** install Docker Desktop first. Port **8080** must be free (or override with `HTTP_PORT`).

**Linux / macOS**
```bash
git clone https://github.com/suryaex/storagehub.git
cd storagehub
./install.sh
# Open the printed URL: http://localhost:8080
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/suryaex/storagehub.git
cd storagehub
.\install.ps1
```

The installer generates a `.env` with random secrets, auto-detects your LAN IP, builds all images, starts the stack behind Nginx, and prints the access URLs.

**First login:** click **"Continue (Local Dev)"** — the first account becomes admin automatically.

### Command reference

| Command | What it does |
|---|---|
| `./install.sh` | Build + start (auto LAN config, auto-installs Docker on Linux) |
| `./install.sh --prod` | Production overlay: `restart=always` + log rotation |
| `./install.sh --rebuild` | Rebuild images from scratch (no cache) |
| `./install.sh --down` | Stop the stack |
| `./install.sh --reset` | Stop and delete all data (DB + files) — prompts for confirmation |
| `./install.sh --reset --yes` | Same, no prompt (non-interactive) |
| `./install.sh --tailscale` | Install Tailscale and bind to its VPN address |
| `./install.sh --public` | Auto-detect and advertise the public IP |
| `HTTP_PORT=9090 ./install.sh` | Use a different port |
| `./uninstall.sh` | Stop + remove install, keep data |
| `./uninstall.sh --purge` | Also delete DB, uploaded files, volumes |
| `./uninstall.sh --yes` | No confirmation prompt |
| `.\install.ps1` | Windows — flags: `-Prod` `-Rebuild` `-Down` `-Reset` |

### Access URLs

| Where | URL |
|---|---|
| This machine | `http://localhost:8080` |
| LAN (phones / other PCs) | `http://<your-LAN-IP>:8080` |
| API docs (Swagger) | `http://localhost:8080/docs` |

Override the port: `HTTP_PORT=9090 ./install.sh`. For Tailscale or public IP access, pass `--tailscale` / `--public`, or set `PUBLIC_HOST=storage.example.com`.

---

## Features

- **Auth** — OAuth2/OIDC: Google, GitHub, Microsoft, generic OIDC. Auto user provisioning, rotating refresh tokens, local dev login.
- **File Explorer** — Finder-style grid / list views, breadcrumbs, drag-and-drop, context menu.
- **Folders** — Nested folders, create / rename / move / soft-delete.
- **Uploads** — Chunked + resumable uploads, per-chunk SHA-256 verification, progress queue.
- **Sharing** — Public, private, and password-protected links with expiry and download limits.
- **Search** — Spotlight-style `⌘K` / `Ctrl+K` overlay across files, folders, and shares.
- **Trash** — Soft delete, restore, permanent delete, configurable retention.
- **Quotas** — Per-user storage quota enforced on upload.
- **Admin** — User management, quota control, activity logs, system settings.
- **Self-update** — In-app "Update & restart" (Settings → Software update): pull → rebuild → restart without SSH.
- **Service ingest** — `POST /api/v1/ingest/logs` (`X-API-Key`) lets SecureOps LogSync archive router/MCU/firewall logs here.
- **Multi-node storage** — Register remote storage nodes (API-only, SQLite, no MySQL/Nginx needed on the node).
- **Security** — Boot guard on default `SECRET_KEY`, security headers, path-traversal-safe ingest, hashed refresh tokens.
- **UI** — macOS Tahoe glassmorphism, dark/light mode, mobile-first responsive.
- **Networking** — LAN / public IP / Tailscale / WireGuard VPN; coexists with SecureOps on the same host.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11–3.13, FastAPI, SQLAlchemy 2.x, Alembic, PyJWT, httpx, passlib |
| Database | MariaDB 11 / MySQL 8 (PyMySQL) |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, React Router |
| Auth | OAuth2 Authorization-Code / OIDC, JWT access + rotating refresh tokens |
| Deploy | Docker Compose / bare-metal systemd, Nginx reverse proxy — x86-64 + ARM |
| Access | LAN · public IP · Tailscale VPN · custom domain (auto-CORS) |

---

## Production (bare-metal, no Docker)

```bash
git clone https://github.com/suryaex/storagehub.git && cd storagehub
sudo bash deployment/deploy-prod.sh
# with a domain:
SERVER_NAME=storage.example.com sudo bash deployment/deploy-prod.sh
```

Supports Ubuntu 20–25 · Debian 11–13 · Fedora / RHEL / Rocky · Arch · openSUSE on x86-64 and ARM. Defaults to `:8080` (web) / `:8010` (backend). Add HTTPS: `sudo certbot --nginx -d storage.example.com`.

---

## Configuration

All settings in `.env` (created from [`.env.example`](.env.example) by the installer).

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — auto-generated by installer. |
| `HTTP_PORT` / `BACKEND_PORT` | Host ports (default `8080` / `8010`). |
| `PUBLIC_HOST` / `PUBLIC_IP` | Public domain / IP for CORS + OAuth callbacks. |
| `ALLOW_LOCAL_LOGIN` | Enable passwordless dev login (`true` / `false`). |
| `SERVICE_API_KEYS` | Comma-separated keys for `X-API-Key` ingest (SecureOps). |
| `DEFAULT_USER_QUOTA` | Default quota bytes for new users. |
| `MAX_UPLOAD_SIZE` | Max upload size (bytes). |
| `GOOGLE_CLIENT_ID` … | OAuth provider credentials (optional per provider). |

---

## Repository Layout

```
storagehub/
├── backend/            # FastAPI modular monolith
│   └── app/api/v1/     # auth · users · folders · files · uploads · shares
│                       # search · dashboard · admin · trash · health · ingest
├── frontend/           # React + Vite + TailwindCSS SPA
├── database/           # schema.sql + seeds
├── deployment/         # nginx config, systemd units, deploy-prod.sh, deploy-node.sh
├── docs/               # PRD, architecture, ERD, API spec, UI spec
├── scripts/            # self-update, RAID setup, health check, setup-deps
├── install.sh / install.ps1 · uninstall.sh
├── docker-compose.yml · docker-compose.prod.yml · .env.example · Makefile
└── INTEROP.md · SECURITY.md
```

---

## License

Penggunaan **khusus internal Politeknik Negeri Sriwijaya** — lihat [LICENSE](LICENSE).
Untuk redistribusi atau penggunaan di luar Polsri, hubungi pengembang melalui Jurusan Teknik Elektro, Politeknik Negeri Sriwijaya.
