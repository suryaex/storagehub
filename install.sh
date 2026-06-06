#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot installer (Docker + Nginx reverse proxy, LAN-ready)
# Usage:
#   ./install.sh              # build + start everything (auto LAN config)
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

detect_compose() {
  if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose";
  elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose";
  else err "Docker Compose not found. Install Docker Desktop / docker-compose first."; exit 1; fi
}
require_docker() {
  command -v docker >/dev/null 2>&1 || { err "Docker is not installed: https://docs.docker.com/get-docker/"; exit 1; }
  docker info >/dev/null 2>&1 || { err "Docker daemon is not running. Start Docker and retry."; exit 1; }
}
rand() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}";
  else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
}
lan_ip() {  # best-effort primary LAN IPv4
  local ip=""
  if command -v ip >/dev/null 2>&1; then ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"; fi
  [ -z "$ip" ] && command -v hostname >/dev/null 2>&1 && ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  [ -z "$ip" ] && command -v ipconfig >/dev/null 2>&1 && ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  echo "${ip:-127.0.0.1}"
}
sed_i() { if sed --version >/dev/null 2>&1; then sed -i "$1" .env; else sed -i '' "$1" .env; fi; }

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

IP="$(lan_ip)"
ok "Detected LAN address: ${IP}"

# ── 1. Environment file (LAN-aware) ──────────────────────────────────────────
if [ -f .env ]; then
  ok ".env already exists — keeping your settings"
  info "Aligning URLs/CORS to LAN IP ${IP} for network access"
  sed_i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://${IP}|"
  sed_i "s|^BACKEND_URL=.*|BACKEND_URL=http://${IP}|"
  sed_i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost,http://${IP}|"
else
  info "Creating .env with generated secrets + LAN config…"
  cp .env.example .env
  sed_i "s|^SECRET_KEY=.*|SECRET_KEY=$(rand 32)|"
  sed_i "s|^MYSQL_PASSWORD=.*|MYSQL_PASSWORD=$(rand 16)|"
  sed_i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=$(rand 16)|"
  sed_i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://${IP}|"
  sed_i "s|^BACKEND_URL=.*|BACKEND_URL=http://${IP}|"
  sed_i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost,http://${IP}|"
  ok ".env created (secrets generated, bound to ${IP})"
fi

# ── 2. Build & start (frontend, backend, mysql, nginx reverse proxy) ─────────
BUILD_FLAG="--build"
[ "${1:-}" = "--no-build" ] && BUILD_FLAG=""
[ "${1:-}" = "--rebuild" ] && { $COMPOSE build --no-cache; BUILD_FLAG="--build"; }

info "Building & starting containers (nginx reverse proxy on port 80)…"
$COMPOSE up -d $BUILD_FLAG

# ── 3. Wait for backend health (through nginx) ───────────────────────────────
info "Waiting for backend to become healthy…"
HEALTHY=0
for _ in $(seq 1 60); do
  if curl -fsS "http://localhost/api/v1/health" >/dev/null 2>&1; then ok "Backend is healthy"; HEALTHY=1; break; fi
  sleep 3; printf "."
done
echo ""
[ "$HEALTHY" = "1" ] || warn "Backend not healthy yet — check logs: $COMPOSE logs -f backend"

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo ""
ok "StorageHub is up (Nginx reverse proxy active)!"
echo ""
echo -e "  ${GREEN}On this machine${NC}     →  http://localhost"
echo -e "  ${GREEN}On the network${NC}      →  http://${IP}        (open from phone/other PCs)"
echo -e "  ${GREEN}API docs${NC}            →  http://${IP}/docs"
echo ""
echo "  First login: \"Continue (Local Dev)\" — the first account becomes admin."
echo "  If other devices can't reach it, allow TCP port 80 in your firewall."
echo "  Logs: $COMPOSE logs -f   |   Stop: ./install.sh --down"
echo ""
