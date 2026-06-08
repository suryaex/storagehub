#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot Docker installer (auto-installs Docker, LAN-ready, Nginx)
# Usage:
#   ./install.sh              # install Docker if needed, build + start
#   ./install.sh --prod       # also apply docker-compose.prod.yml (restart=always, log rotation)
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

# ── Args ─────────────────────────────────────────────────────────────────────
ACTION="up"; PROD=0
for a in "$@"; do case "$a" in
  --down) ACTION="down" ;; --reset) ACTION="reset" ;;
  --rebuild) ACTION="rebuild" ;; --no-build) ACTION="nobuild" ;;
  --prod) PROD=1 ;;
esac; done

# Host HTTP port — 8080 so StorageHub does NOT collide with SecureOps (:80).
HTTP_PORT="${HTTP_PORT:-8080}"
DOCKER_SUDO=""
COMPOSE=""

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    if [ "$(uname -s)" = "Linux" ]; then
      info "Docker not found — installing via get.docker.com…"
      curl -fsSL https://get.docker.com | sudo sh
      sudo systemctl enable --now docker 2>/dev/null || true
      sudo usermod -aG docker "$(id -un)" 2>/dev/null || true
    else
      err "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"; exit 1
    fi
  fi
  if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
  elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
  else
    sudo systemctl start docker 2>/dev/null || true
    if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
    elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
    else err "Docker daemon not available. Start Docker and retry."; exit 1; fi
  fi
}

detect_compose() {
  if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose";
  elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker-compose";
  else
    warn "Docker Compose v2 plugin missing — attempting install…"
    command -v apt-get >/dev/null 2>&1 && { sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin || true; }
    if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose"
    else err "Could not get Docker Compose v2. Install it and retry."; exit 1; fi
  fi
}

rand() {
  if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}";
  else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
}
lan_ip() {
  local ip=""
  if command -v ip >/dev/null 2>&1; then ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"; fi
  [ -z "$ip" ] && command -v hostname >/dev/null 2>&1 && ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  [ -z "$ip" ] && command -v ipconfig >/dev/null 2>&1 && ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  echo "${ip:-127.0.0.1}"
}
sed_i() { if sed --version >/dev/null 2>&1; then sed -i "$1" .env; else sed -i '' "$1" .env; fi; }

# compose file selection
CF="-f docker-compose.yml"
[ "$PROD" = "1" ] && [ -f docker-compose.prod.yml ] && { CF="$CF -f docker-compose.prod.yml"; }

# ── Subcommands ──────────────────────────────────────────────────────────────
if [ "$ACTION" = "down" ];  then ensure_docker; detect_compose; info "Stopping…"; $COMPOSE $CF down; ok "Stopped."; exit 0; fi
if [ "$ACTION" = "reset" ]; then ensure_docker; detect_compose; warn "This deletes ALL data (DB + uploaded files)!";
  read -r -p "Type 'yes' to continue: " c; [ "$c" = "yes" ] && $COMPOSE $CF down -v && ok "Reset done." || echo "Aborted."; exit 0; fi

echo ""
echo "  ╭───────────────────────────────────────────╮"
echo "  │   StorageHub · self-hosted file storage   │"
echo "  ╰───────────────────────────────────────────╯"
echo ""

ensure_docker
detect_compose
ok "Docker ready  ($COMPOSE)"
[ "$PROD" = "1" ] && ok "Production overlay enabled (docker-compose.prod.yml)"

IP="$(lan_ip)"
ok "Detected LAN address: ${IP}"

# ── 1. Environment file (LAN-aware) ──────────────────────────────────────────
if [ -f .env ]; then
  ok ".env already exists — keeping secrets, aligning URLs to LAN"
else
  info "Creating .env with generated secrets + LAN config…"
  cp .env.example .env
  sed_i "s|^SECRET_KEY=.*|SECRET_KEY=$(rand 32)|"
  sed_i "s|^MYSQL_PASSWORD=.*|MYSQL_PASSWORD=$(rand 16)|"
  sed_i "s|^MYSQL_ROOT_PASSWORD=.*|MYSQL_ROOT_PASSWORD=$(rand 16)|"
  ok ".env created (secrets generated)"
fi
grep -q "^HTTP_PORT=" .env || echo "HTTP_PORT=${HTTP_PORT}" >> .env
sed_i "s|^HTTP_PORT=.*|HTTP_PORT=${HTTP_PORT}|"
sed_i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://${IP}:${HTTP_PORT}|"
sed_i "s|^BACKEND_URL=.*|BACKEND_URL=http://${IP}:${HTTP_PORT}|"
sed_i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost:${HTTP_PORT},http://${IP}:${HTTP_PORT}|"
ok "Bound to network address ${IP}"

# ── 2. Build & start (frontend, backend, mysql, nginx reverse proxy) ─────────
case "$ACTION" in
  rebuild) $COMPOSE $CF build --no-cache; BUILD="--build" ;;
  nobuild) BUILD="" ;;
  *)       BUILD="--build" ;;
esac
info "Building & starting containers (nginx reverse proxy on port ${HTTP_PORT})…"
$COMPOSE $CF up -d $BUILD

# ── 3. Wait for backend health ───────────────────────────────────────────────
info "Waiting for backend to become healthy…"
HEALTHY=0
for _ in $(seq 1 60); do
  if curl -fsS "http://localhost:${HTTP_PORT}/api/v1/health" >/dev/null 2>&1; then ok "Backend is healthy"; HEALTHY=1; break; fi
  sleep 3; printf "."
done
echo ""
[ "$HEALTHY" = "1" ] || warn "Backend not healthy yet — check logs: $COMPOSE logs -f backend"

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo ""
ok "StorageHub is up (Nginx reverse proxy active)!"
echo ""
echo -e "  ${GREEN}On this machine${NC}     →  http://localhost:${HTTP_PORT}"
echo -e "  ${GREEN}On the network${NC}      →  http://${IP}:${HTTP_PORT}   (open from phone/other PCs)"
echo -e "  ${GREEN}API docs${NC}            →  http://${IP}:${HTTP_PORT}/docs"
echo ""
echo "  First login: \"Continue (Local Dev)\" — the first account becomes admin."
echo "  If other devices can't reach it, allow TCP port ${HTTP_PORT} in your firewall."
echo "  Logs: $COMPOSE logs -f   |   Stop: ./install.sh --down"
echo ""
