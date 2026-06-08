# StorageHub — Installation Guide

Three ways to run StorageHub: **one-shot installer (easiest)**, **Docker Compose (manual)**,
or **local development**.

> StorageHub publishes the web UI on port **8080** and the backend on **8010** by
> default, so it coexists with [SecureOps](https://github.com/suryaex/secureops)
> (`:80` / `:8000`) on the same host — see [`../INTEROP.md`](../INTEROP.md).
> Override with `HTTP_PORT` / `BACKEND_PORT`. Runs on x86-64 **and** ARM
> (arm64 / armv7 — Raspberry Pi, Orange Pi).

---

## 0. One-shot installer (easiest)

The installer checks Docker, generates a `.env` with secure random secrets, builds all
images, starts the stack, and waits until the backend is healthy.

```bash
# Linux / macOS
chmod +x install.sh && ./install.sh

# Windows (PowerShell)
.\install.ps1

# or
make install
```

Then open **http://localhost:8080** and click **“Continue (Local Dev)”** (first account = admin).

Manage it:
```bash
./install.sh --rebuild   # rebuild images       (.\install.ps1 -Rebuild)
./install.sh --down      # stop                 (.\install.ps1 -Down)
./install.sh --reset     # stop + delete data   (.\install.ps1 -Reset)
```

---

## 0b. Bare-metal production (Linux, no Docker)

Installs system packages, MariaDB/MySQL (DB + user), Node, backend venv, frontend
build, Nginx reverse proxy, and a systemd service — all in one command:

```bash
sudo bash deployment/deploy-prod.sh
# with a domain:
SERVER_NAME=storage.example.com sudo bash deployment/deploy-prod.sh
# re-deploy after changes:
./deployment/deploy-prod.sh --update
```

Supports Ubuntu/Debian/Mint/Pop!_OS, Fedora/RHEL/Rocky/Alma, openSUSE, and Arch —
on **x86-64 and ARM** (arm64 / armv7). Defaults: web `:8080`, backend `:8010`
(override with `HTTP_PORT` / `BACKEND_PORT`).

---

## A. Docker Compose (manual)

### Prerequisites
- Docker Engine 24+
- Docker Compose v2 (`docker compose`)

### Steps

```bash
# 1. Clone
git clone https://github.com/<your-username>/storagehub.git
cd storagehub

# 2. Environment
cp .env.example .env
#   Required: set a strong SECRET_KEY and MySQL passwords.
#   Optional: add OAuth client IDs/secrets to enable Google/GitHub/Microsoft/OIDC.

# 3. Start
docker compose up -d --build

# 4. Verify
docker compose ps
curl http://localhost:8080/api/v1/health
```

### Access
| What            | URL                              |
|-----------------|----------------------------------|
| App             | http://localhost:8080            |
| API docs        | http://localhost:8080/docs       |
| Backend (via Nginx) | http://localhost:8080/docs   |

The first user to log in becomes **admin** automatically.
With no OAuth configured, use the **local dev login** on the sign-in screen.

### Common commands
```bash
docker compose logs -f backend     # tail backend logs
docker compose restart backend     # restart a service
docker compose down                # stop
docker compose down -v             # stop and wipe data (DESTRUCTIVE)
```

---

## B. Manual local development

### 1. MariaDB / MySQL
Create the database and user, then import the schema:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p storagehub < database/seeds/seed.sql
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export DATABASE_URL="mysql+pymysql://storagehub:storagehub@localhost:3306/storagehub"
export SECRET_KEY="dev-secret"
export STORAGE_ROOT="../storage"
export ALLOW_LOCAL_LOGIN=true

uvicorn app.main:app --reload --port 8000
```
Tables are auto-created on startup if missing. Docs at http://localhost:8000/docs.

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (proxies /api → :8000)
```

---

## C. Configuring OAuth providers

Register an OAuth app with each provider and set the callback URL:

```
http://localhost:8080/api/v1/auth/callback/google
http://localhost:8080/api/v1/auth/callback/github
http://localhost:8080/api/v1/auth/callback/microsoft
http://localhost:8080/api/v1/auth/callback/oidc
```

Then put the credentials in `.env`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
Restart the backend. Enabled providers appear automatically on the login screen.

> In production set `ALLOW_LOCAL_LOGIN=false`, serve over HTTPS, and use real OAuth.

---

## D. Pushing to GitHub

```bash
cd storagehub
git init
git add .
git commit -m "Initial commit: StorageHub"
git branch -M main
git remote add origin https://github.com/<your-username>/storagehub.git
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.venv/`, `.env`, and runtime storage.
A CI workflow at `.github/workflows/ci.yml` builds the backend and frontend on every push.
