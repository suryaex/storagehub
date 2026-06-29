#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — one-shot Docker installer (auto-installs Docker, LAN-ready, Nginx)
# Usage:
#   ./install.sh              # install Docker if needed, build + start
#   ./install.sh --prod       # also apply docker-compose.prod.yml (restart=always, log rotation)
#   ./install.sh --rebuild    # force rebuild images
#   ./install.sh --down       # stop the stack
#   ./install.sh --reset      # stop and DELETE all data (volumes)
#   ./install.sh --tailscale  # install + join Tailscale, use its VPN IP
#   ./install.sh --public     # auto-detect public IP and add it to CORS
# Env: PUBLIC_HOST=storage.example.com   (public domain for OAuth + CORS)
#      PUBLIC_IP=1.2.3.4                  (advertise a fixed public IP)
# Reachable over LAN, public IP, or a VPN (Tailscale) — like SecureOps.
#
# Docker install is resilient: if get.docker.com mirrors fail (common on Fedora),
# it falls back to the distro engine (Fedora 'moby-engine', Debian 'docker.io').
# On WSL it prefers Docker Desktop integration and handles a missing systemd; if
# Docker can't be installed it points you to the no-Docker path (deploy-prod.sh).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info()  { echo -e "${BLUE}▸${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }

# ── Args ─────────────────────────────────────────────────────────────────────
ACTION="up"; PROD=0; TAILSCALE=0; PUBLIC_DETECT=0; UPDATER=1
for a in "$@"; do case "$a" in
  --down) ACTION="down" ;; --reset) ACTION="reset" ;;
  --rebuild) ACTION="rebuild" ;; --no-build) ACTION="nobuild" ;;
  --prod) PROD=1 ;;
  --tailscale) TAILSCALE=1 ;;
  --public) PUBLIC_DETECT=1 ;;
  --no-updater) UPDATER=0 ;;
esac; done

STATE_DIR="${STORAGEHUB_STATE_DIR:-/var/lib/storagehub}"

# Host HTTP port — 8080 so StorageHub does NOT collide with SecureOps (:80).
HTTP_PORT="${HTTP_PORT:-8080}"
DOCKER_SUDO=""
COMPOSE=""

is_wsl() { grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; }

pkgmgr() {
  if   command -v dnf     >/dev/null 2>&1; then echo dnf
  elif command -v apt-get >/dev/null 2>&1; then echo apt
  elif command -v zypper  >/dev/null 2>&1; then echo zypper
  elif command -v pacman  >/dev/null 2>&1; then echo pacman
  elif command -v yum     >/dev/null 2>&1; then echo yum
  else echo ""; fi
}

start_docker_daemon() {
  # systemd → sysv service → background dockerd (WSL without systemd)
  sudo systemctl enable --now docker >/dev/null 2>&1 && return 0
  sudo service docker start >/dev/null 2>&1 && return 0
  if command -v dockerd >/dev/null 2>&1 && ! pgrep -x dockerd >/dev/null 2>&1; then
    info "Starting dockerd in background (no systemd)…"
    sudo sh -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'
    sleep 4
  fi
  return 0
}

install_docker() {
  local pm; pm="$(pkgmgr)"
  # 1) upstream convenience script — best when download.docker.com mirrors are healthy
  info "Installing Docker via get.docker.com…"
  if curl -fsSL https://get.docker.com | sudo sh >/dev/null 2>&1 && command -v docker >/dev/null 2>&1; then
    return 0
  fi
  warn "get.docker.com failed (mirror/network) — falling back to distro packages…"
  # 2) distro-native engine. On Fedora/RHEL 'moby-engine' lives in the main repos,
  #    so it avoids the flaky download.docker.com docker-ce mirror entirely.
  case "$pm" in
    dnf|yum)
      # engine and compose installed separately so a missing pkg doesn't fail the other
      sudo "$pm" install -y --setopt=retries=10 --skip-broken moby-engine 2>/dev/null \
        || sudo "$pm" install -y --setopt=retries=10 --skip-broken docker 2>/dev/null || true
      sudo "$pm" install -y --skip-broken docker-compose 2>/dev/null \
        || sudo "$pm" install -y --skip-broken moby-compose 2>/dev/null || true
      ;;
    apt)
      sudo apt-get update -y || true
      sudo apt-get install -y docker.io 2>/dev/null || true
      sudo apt-get install -y docker-compose-v2 2>/dev/null \
        || sudo apt-get install -y docker-compose 2>/dev/null || true
      ;;
    zypper)  sudo zypper --non-interactive install docker docker-compose 2>/dev/null || true ;;
    pacman)  sudo pacman -Sy --noconfirm docker docker-compose 2>/dev/null || true ;;
  esac
  command -v docker >/dev/null 2>&1 && return 0
  # 3) last resort: podman with the docker shim (Fedora ships these)
  case "$pm" in
    dnf|yum) sudo "$pm" install -y podman podman-docker 2>/dev/null || true ;;
  esac
  command -v docker >/dev/null 2>&1
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    if [ "$(uname -s)" != "Linux" ]; then
      err "Docker is not installed. Install Docker Desktop: https://docs.docker.com/get-docker/"; exit 1
    fi
    if is_wsl; then
      warn "WSL detected — the smoothest path is Docker Desktop with WSL integration"
      warn "  (Docker Desktop → Settings → Resources → WSL integration → enable this distro)."
      warn "Trying to install a Docker engine inside WSL as a fallback…"
    fi
    if ! install_docker; then
      err "Could not install Docker automatically (mirror/network issue). Choose one:"
      err "  1) Install Docker Desktop + enable WSL integration, then re-run ./install.sh"
      err "  2) Run WITHOUT Docker (bare-metal):  sudo bash deployment/deploy-prod.sh"
      exit 1
    fi
    sudo usermod -aG docker "$(id -un)" 2>/dev/null || true
  fi

  start_docker_daemon
  if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
  elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
  else
    start_docker_daemon
    if docker info >/dev/null 2>&1; then DOCKER_SUDO="";
    elif sudo docker info >/dev/null 2>&1; then DOCKER_SUDO="sudo";
    else
      err "Docker daemon not available."
      if is_wsl; then
        err "WSL without systemd — enable it: add to /etc/wsl.conf →  [boot]\\n    systemd=true"
        err "then run 'wsl --shutdown' in Windows and reopen. Or use Docker Desktop integration."
      fi
      err "Or run without Docker:  sudo bash deployment/deploy-prod.sh"
      exit 1
    fi
  fi
}

detect_compose() {
  if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose"; return 0; fi
  if command -v docker-compose >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker-compose"; return 0; fi
  warn "Docker Compose not found — attempting install…"
  case "$(pkgmgr)" in
    apt)     sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin 2>/dev/null || sudo apt-get install -y docker-compose 2>/dev/null || true ;;
    dnf|yum) sudo "$(pkgmgr)" install -y --skip-broken docker-compose moby-compose 2>/dev/null || true ;;
    zypper)  sudo zypper --non-interactive install docker-compose 2>/dev/null || true ;;
    pacman)  sudo pacman -Sy --noconfirm docker-compose 2>/dev/null || true ;;
  esac
  if $DOCKER_SUDO docker compose version >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="$DOCKER_SUDO docker-compose"
  else err "Could not get Docker Compose. Install it (or use deployment/deploy-prod.sh) and retry."; exit 1; fi
}

# Install the host-side update watcher so the dashboard's "Update & restart"
# button actually runs: it writes a trigger into $STATE_DIR (bind-mounted into
# the backend container), and this systemd service runs self-update.sh --watch
# on the host (where git + docker live) to pull + rebuild + restart the stack.
setup_updater_watcher() {
  [ "$UPDATER" = "1" ] || { info "Skipping update watcher (--no-updater)"; return 0; }
  local repo_dir unit src; repo_dir="$(pwd)"
  sudo mkdir -p "$STATE_DIR" 2>/dev/null || mkdir -p "$STATE_DIR" 2>/dev/null || true

  if ! command -v systemctl >/dev/null 2>&1; then
    warn "systemd not found — in-app 'Update & restart' needs a watcher."
    warn "Run it yourself on the host:  bash ${repo_dir}/scripts/self-update.sh --watch"
    return 0
  fi
  src="${repo_dir}/scripts/storagehub-updater.service"
  [ -f "$src" ] || { warn "Updater unit template missing (${src}) — skipping."; return 0; }

  unit="/etc/systemd/system/storagehub-updater.service"
  info "Installing update watcher service (storagehub-updater)…"
  if sed "s|__REPO_DIR__|${repo_dir}|g" "$src" | sudo tee "$unit" >/dev/null 2>&1; then
    sudo systemctl daemon-reload >/dev/null 2>&1 || true
    if sudo systemctl enable --now storagehub-updater.service >/dev/null 2>&1; then
      ok "Update watcher active — the dashboard can pull + rebuild + restart."
    else
      warn "Could not enable storagehub-updater.service. Start it manually:"
      warn "  sudo systemctl enable --now storagehub-updater.service"
    fi
  else
    warn "Could not write ${unit} (need sudo). In-app updates will queue but not run."
    warn "Run on host instead:  bash ${repo_dir}/scripts/self-update.sh --watch"
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
ts_ip() {  # Tailscale (VPN) IPv4, if joined
  command -v tailscale >/dev/null 2>&1 && tailscale ip -4 2>/dev/null | head -n1 || true
}
pub_ip() {  # public IP (only when --public; best-effort, short timeout)
  curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null ||   curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null || true
}
# Comma-join http(s) origins for every non-empty host on :HTTP_PORT
build_origins() {
  local p=":${HTTP_PORT}" out="http://localhost${p}" h
  for h in "$IP" "$TSIP" "$PUBIP"; do
    [ -n "$h" ] && out="${out},http://${h}${p}"
  done
  if [ -n "$PUBLIC_HOST" ]; then
    out="${out},http://${PUBLIC_HOST}${p},http://${PUBLIC_HOST},https://${PUBLIC_HOST}"
  fi
  echo "$out"
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

# VPN (Tailscale) — install on --tailscale, then use its IP (like SecureOps)
if [ "$TAILSCALE" = "1" ] && ! command -v tailscale >/dev/null 2>&1; then
  info "Installing Tailscale…"; curl -fsSL https://tailscale.com/install.sh | sh || warn "Tailscale install failed (continuing)"
  command -v tailscale >/dev/null 2>&1 && { sudo tailscale up 2>/dev/null || warn "Run 'sudo tailscale up' then re-run with --tailscale"; }
fi
TSIP="$(ts_ip)";   [ -n "$TSIP" ] && ok "Tailscale IP: ${TSIP}"
PUBIP=""; [ "$PUBLIC_DETECT" = "1" ] && { PUBIP="$(pub_ip)"; [ -n "$PUBIP" ] && ok "Public IP: ${PUBIP}"; }
[ -n "${PUBLIC_IP:-}" ] && PUBIP="$PUBLIC_IP"     # explicit override
PUBLIC_HOST="${PUBLIC_HOST:-}"                    # optional public domain
# Primary URL for OAuth redirects: domain > Tailscale > public > LAN
PRIMARY="$IP"; [ -n "$PUBIP" ] && PRIMARY="$PUBIP"; [ -n "$TSIP" ] && PRIMARY="$TSIP"; [ -n "$PUBLIC_HOST" ] && PRIMARY="$PUBLIC_HOST"

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
PRIMURL="http://${PRIMARY}:${HTTP_PORT}"; [ -n "$PUBLIC_HOST" ] && PRIMURL="http://${PUBLIC_HOST}"
sed_i "s|^FRONTEND_URL=.*|FRONTEND_URL=${PRIMURL}|"
sed_i "s|^BACKEND_URL=.*|BACKEND_URL=${PRIMURL}|"
sed_i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=$(build_origins)|"
ok "Reachable via: localhost / LAN ${IP}${TSIP:+ / Tailscale ${TSIP}}${PUBIP:+ / public ${PUBIP}}"

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

# Enable in-app "Update & restart" (download + reinstall everything from the UI).
setup_updater_watcher

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo ""
ok "StorageHub is up (Nginx reverse proxy active)!"
echo ""
echo -e "  ${GREEN}On this machine${NC}     →  http://localhost:${HTTP_PORT}"
echo -e "  ${GREEN}On the network${NC}      →  http://${IP}:${HTTP_PORT}   (open from phone/other PCs)"
[ -n "$TSIP" ] && echo -e "  ${GREEN}Over Tailscale VPN${NC}  →  http://${TSIP}:${HTTP_PORT}"
[ -n "$PUBIP" ] && echo -e "  ${GREEN}Public IP${NC}           →  http://${PUBIP}:${HTTP_PORT}   (open the port in your firewall/router)"
echo -e "  ${GREEN}API docs${NC}            →  http://${IP}:${HTTP_PORT}/docs"
echo ""
echo "  First login: \"Continue (Local Dev)\" — the first account becomes admin."
echo "  If other devices can't reach it, allow TCP port ${HTTP_PORT} in your firewall."
echo "  Logs: $COMPOSE logs -f   |   Stop: ./install.sh --down"
echo ""
