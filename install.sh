#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot installer (Docker)
# Usage:
#   ./install.sh              # build + start everything
#   ./install.sh --rebuild    # force rebuild images
#   ./install.sh --down       # stop the stack
#   ./install.sh --reset      # stop and DELETE all data (volumes)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }

# ── Compose command detection ────────────────────────────────────────────────
detect_compose() {
  if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose";
  elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose";
  else err "Docker Compose not found. Install Docker Desktop / docker-compose first."; exit 1; fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed. Get it at https://docs.docker.com/get-docker/"; exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    err "Docker daemon is not running. Start Docker and retry."; exit 1
  fi
}

rand() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}";
  else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
}

# ── Subcommands ──────────────────────────────────────────────────────────────
case "${1:-}" in
  --down)  detect_compose; require_docker; info "Stopping StorageHub…"; $COMPOSE down; ok "Stopped."; exit 0 ;;
  --reset) detect_compose; require_docker; warn "This deletes ALL data (DB + uploaded files)!";
           read -r -p "Type 'yes' to continue: " c; [ "$c" = "yes" ] && $COMPOSE down -v && ok "Reset done." || echo "Aborted."; exit 0 ;;
esac

echo ""
echo "  ╭───────────────────────────────────────────╮"
echo "  │   StorageHub · self-hosted file storage   │"
echo "  ╰───────────────────────────────────────────╯"
echo ""

require_docker
detect_compose
ok "Docker ready  ($COMPOSE)"

# ── 1. Environment file ──────────────────────────────────────────────────────
if [ -f .env ]; then
  ok ".env already exists — keeping your settings"
else
  info "Creating .env with generated secrets…"
  cp .env.example .env
  SECRET_KEY="$(rand 32)"
  DB_PASS="$(rand 16)"
  DB_ROOT="$(rand 16)"
  # portable in-place sed (Linux + macOS/BSD)
  sed_i() { if sed --version >/dev/null 2>&1; then sed -i "$1" .env; else sed -i '' "$1" .env; fi; }
  sed_i "s|^SECRET_KEY=.*|SECRET_KEY=${SECRET_KEY}|"
  sed_i "s|^MYSQL_PASSWORD=.*|MYSQL_PASSWORD=${DB_PASS}|"
  sed_i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=${DB_ROOT}|"
  ok ".env created (SECRET_KEY + MySQL passwords auto-generated)"
fi

# ── 2. Build & start ─────────────────────────────────────────────────────────
BUILD_FLAG="--build"
[ "${1:-}" = "--no-build" ] && BUILD_FLAG=""
[ "${1:-}" = "--rebuild" ] && BUILD_FLAG="--build --no-cache" && $COMPOSE build --no-cache

info "Building & starting containers (first run downloads images, please wait)…"
$COMPOSE up -d $BUILD_FLAG

# ── 3. Wait for backend health ───────────────────────────────────────────────
info "Waiting for backend to become healthy…"
URL="http://localhost/api/v1/health"
for i in $(seq 1 60); do
  if curl -fsS "$URL" >/dev/null 2>&1; then ok "Backend is healthy"; HEALTHY=1; break; fi
  sleep 3; printf "."
done
echo ""
[ "${HEALTHY:-0}" = "1" ] || warn "Backend not healthy yet — check logs: $COMPOSE logs -f backend"

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo ""
ok "StorageHub is up!"
echo ""
echo -e "  ${GREEN}App${NC}        →  http://localhost"
echo -e "  ${GREEN}API docs${NC}   →  http://localhost/docs"
echo ""
echo "  First login: click \"Continue (Local Dev)\" — the first account becomes admin."
echo "  Logs: $COMPOSE logs -f   |   Stop: ./install.sh --down"
echo ""
