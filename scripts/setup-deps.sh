#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — dependency installer & repair (bare-metal / dev, no Docker)
#
# Installs ALL backend (Python) and frontend (Node) libraries, and can repair
# broken/corrupted installs.
#
# Usage:
#   ./scripts/setup-deps.sh                 # install everything (idempotent)
#   ./scripts/setup-deps.sh --repair        # force clean reinstall + fix broken
#   ./scripts/setup-deps.sh --backend-only
#   ./scripts/setup-deps.sh --frontend-only
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${BLUE}▸${NC} $*"; }; ok(){ echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}!${NC} $*"; }; err(){ echo -e "${RED}✗${NC} $*" >&2; }

REPAIR=0; DO_BACKEND=1; DO_FRONTEND=1
for a in "$@"; do case "$a" in
  --repair) REPAIR=1 ;;
  --backend-only) DO_FRONTEND=0 ;;
  --frontend-only) DO_BACKEND=0 ;;
esac; done

# ── Best-effort system prerequisites ─────────────────────────────────────────
pkg_install() {
  # $@ = package names; tries the available package manager (needs sudo)
  if command -v apt-get >/dev/null 2>&1;  then sudo apt-get update -y && sudo apt-get install -y "$@";
  elif command -v dnf >/dev/null 2>&1;    then sudo dnf install -y "$@";
  elif command -v yum >/dev/null 2>&1;    then sudo yum install -y "$@";
  elif command -v pacman >/dev/null 2>&1; then sudo pacman -Sy --noconfirm "$@";
  elif command -v zypper >/dev/null 2>&1; then sudo zypper install -y "$@";
  elif command -v brew >/dev/null 2>&1;   then brew install "$@";
  else warn "No known package manager — install manually: $*"; return 1; fi
}

ensure_cmd() {  # ensure_cmd <command> <package...>
  local cmd="$1"; shift
  if ! command -v "$cmd" >/dev/null 2>&1; then
    warn "$cmd not found — attempting install ($*)"
    pkg_install "$@" || err "Could not auto-install $cmd; please install it manually."
  fi
}

# ── Backend (Python) ─────────────────────────────────────────────────────────
setup_backend() {
  info "Backend: Python dependencies"
  ensure_cmd python3 python3 python3-venv python3-pip
  PYBIN="$(command -v python3 || command -v python)"
  cd backend

  if [ "$REPAIR" = "1" ] && [ -d .venv ]; then
    warn "Repair mode: removing old virtualenv"; rm -rf .venv
  fi
  [ -d .venv ] || { info "Creating virtualenv"; "$PYBIN" -m venv .venv; }
  # shellcheck disable=SC1091
  source .venv/bin/activate

  python -m pip install --upgrade pip setuptools wheel
  if [ "$REPAIR" = "1" ]; then
    info "Force-reinstalling all packages (no cache)"
    pip install --force-reinstall --no-cache-dir -r requirements.txt
  else
    pip install -r requirements.txt
  fi

  info "Verifying dependency tree (pip check)"
  if ! pip check; then
    warn "pip check found issues — repairing"
    pip install --force-reinstall --no-cache-dir -r requirements.txt
    pip check && ok "Dependencies repaired"
  fi
  python -c "import app.main" >/dev/null 2>&1 && ok "Backend imports cleanly" \
    || warn "Backend import needs a database/env to fully load (normal without .env)"
  deactivate || true
  cd ..
  ok "Backend ready (venv: backend/.venv)"
}

# ── Frontend (Node) ──────────────────────────────────────────────────────────
setup_frontend() {
  info "Frontend: Node dependencies"
  ensure_cmd node nodejs npm
  ensure_cmd npm npm
  cd frontend

  if [ "$REPAIR" = "1" ]; then
    warn "Repair mode: clearing node_modules + lockfile + npm cache"
    rm -rf node_modules package-lock.json
    npm cache verify || npm cache clean --force || true
  fi

  if [ -f package-lock.json ] && [ "$REPAIR" = "0" ]; then
    npm ci || npm install
  else
    npm install
  fi

  info "Verifying install (npm ls)"
  npm ls --depth=0 >/dev/null 2>&1 && ok "Frontend dependency tree OK" \
    || warn "npm reported peer/extraneous warnings (usually safe)"
  cd ..
  ok "Frontend ready (frontend/node_modules)"
}

echo ""
echo "  StorageHub · dependency setup  (repair=$REPAIR)"
echo ""
[ "$DO_BACKEND" = "1" ] && setup_backend
[ "$DO_FRONTEND" = "1" ] && setup_frontend
echo ""
ok "All dependencies installed."
echo "  Run backend : cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "  Run frontend: cd frontend && npm run dev -- --host"
echo ""
