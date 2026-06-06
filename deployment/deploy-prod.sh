#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — PRODUCTION deploy (bare-metal, no Docker)
#
# Installs EVERYTHING, builds, and wires up systemd + nginx in one shot:
#   • system packages (Python, build tools, nginx, rsync, curl, git)
#   • MySQL / MariaDB server  (creates database + app user)
#   • Node.js LTS             (frontend build)
#   • backend venv + pip deps
#   • frontend npm build → published to the web root
#   • nginx reverse proxy (SPA + /api + /docs)
#   • systemd service for the backend (uvicorn)
#
# Supports: Ubuntu 20.04–25.04 · Debian 11–13 · Linux Mint / Pop!_OS / elementary
#           Fedora / RHEL / Rocky / Alma (dnf) · openSUSE (zypper) · Arch (pacman)
#
# Usage:
#   bash deployment/deploy-prod.sh
#   SERVER_NAME=storage.example.com bash deployment/deploy-prod.sh
#   ./deployment/deploy-prod.sh --update     # git pull + rebuild + restart
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# -------- Configuration --------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"
ENV_FILE="$BACKEND_DIR/.env"

SERVER_NAME="${SERVER_NAME:-_}"
FRONTEND_ROOT="${FRONTEND_ROOT:-/var/www/storagehub}"
STORAGE_ROOT="${STORAGE_ROOT:-/var/lib/storagehub}"
NGINX_SITE="${NGINX_SITE:-storagehub}"
NODE_VERSION="${NODE_VERSION:-20}"
DB_NAME="${DB_NAME:-storagehub}"
DB_USER="${DB_USER:-storagehub}"
SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-$(id -un)}}"
UPDATE_MODE=0
[[ "${1:-}" == "--update" ]] && UPDATE_MODE=1

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
say()  { echo -e "${GREEN}==> $*${NC}"; }
info() { echo -e "${BLUE}ℹ  $*${NC}"; }
warn() { echo -e "${YELLOW}!! $*${NC}"; }
die()  { echo -e "${RED}ERROR: $*${NC}"; exit 1; }

rand() { if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}"; else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi; }

# -------- Detect distro / package manager --------
detect_distro() {
  [[ -f /etc/os-release ]] || die "Cannot detect distro (/etc/os-release missing)."
  # shellcheck disable=SC1091
  . /etc/os-release
  DISTRO_ID="${ID,,}"; DISTRO_VERSION="${VERSION_ID:-unknown}"; DISTRO_MAJOR="${DISTRO_VERSION%%.*}"
  PRETTY="${PRETTY_NAME:-$DISTRO_ID}"
  if   command -v apt-get >/dev/null 2>&1; then PKG="apt"
  elif command -v dnf     >/dev/null 2>&1; then PKG="dnf"
  elif command -v yum     >/dev/null 2>&1; then PKG="yum"
  elif command -v zypper  >/dev/null 2>&1; then PKG="zypper"
  elif command -v pacman  >/dev/null 2>&1; then PKG="pacman"
  else die "No supported package manager (apt/dnf/yum/zypper/pacman)."; fi
}

detect_distro
say "Detected: $PRETTY (id=$DISTRO_ID, pkg=$PKG)"
say "Deploy user (backend service): $SERVICE_USER"
[[ $EUID -ne 0 ]] && warn "Some steps need sudo — you may be prompted."
export DEBIAN_FRONTEND=noninteractive

# -------- 0) Optional: update repo --------
if [[ "$UPDATE_MODE" == "1" ]]; then
  say "Update mode: pulling latest from git…"
  git -C "$REPO_DIR" pull --ff-only || warn "git pull skipped/failed (non-fatal)."
fi

# -------- 1) System packages --------
say "Installing system packages via $PKG…"
case "$PKG" in
  apt)
    sudo apt-get update -y
    sudo apt-get install -y --no-install-recommends \
        python3 python3-venv python3-pip python3-dev \
        build-essential libffi-dev pkg-config \
        nginx curl gnupg ca-certificates rsync git
    # MySQL (Ubuntu) with MariaDB fallback (Debian/Mint)
    sudo apt-get install -y mysql-server || sudo apt-get install -y mariadb-server
    ;;
  dnf|yum)
    sudo $PKG install -y \
        python3 python3-pip python3-devel \
        gcc gcc-c++ make libffi-devel pkgconf-pkg-config \
        nginx curl gnupg2 ca-certificates rsync git \
        mariadb-server
    ;;
  zypper)
    sudo zypper --non-interactive install \
        python3 python3-pip python3-devel \
        gcc gcc-c++ make libffi-devel pkg-config \
        nginx curl gpg2 ca-certificates rsync git \
        mariadb
    ;;
  pacman)
    sudo pacman -Sy --noconfirm \
        python python-pip base-devel libffi pkgconf \
        nginx curl gnupg ca-certificates rsync git \
        mariadb
    ;;
esac

# -------- 2) Node.js LTS --------
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJ=$(node -v | sed 's/v//' | cut -d. -f1)
  [[ "$NODE_MAJ" -ge 18 ]] && { info "Node $(node -v) already installed"; NEED_NODE=0; }
fi
if [[ "$NEED_NODE" == "1" ]]; then
  say "Installing Node.js $NODE_VERSION LTS…"
  case "$PKG" in
    apt)      curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash - ; sudo apt-get install -y nodejs ;;
    dnf|yum)  curl -fsSL "https://rpm.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash - ; sudo $PKG install -y nodejs ;;
    zypper)   sudo zypper --non-interactive install "nodejs${NODE_VERSION}" "npm${NODE_VERSION}" || sudo zypper --non-interactive install nodejs npm ;;
    pacman)   sudo pacman -S --noconfirm nodejs npm ;;
  esac
fi
info "Node: $(node --version)  |  npm: $(npm --version)  |  Python: $(python3 --version)"

# -------- 3) MySQL / MariaDB: start + create database & user --------
say "Configuring database…"
sudo systemctl enable --now mysql 2>/dev/null || sudo systemctl enable --now mariadb 2>/dev/null || true
# Arch/MariaDB first-run init
if [[ "$PKG" == "pacman" && ! -d /var/lib/mysql/mysql ]]; then
  sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql >/dev/null 2>&1 || true
  sudo systemctl enable --now mariadb || true
fi

# Reuse existing DB password if .env already has one, else generate
if [[ -f "$ENV_FILE" ]] && grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  DB_PASS="$(sed -n 's#^DATABASE_URL=mysql+pymysql://[^:]*:\([^@]*\)@.*#\1#p' "$ENV_FILE")"
fi
DB_PASS="${DB_PASS:-$(rand 16)}"

sudo mysql <<SQL || warn "DB step needs manual check (is the server running / socket auth available?)"
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
info "Database '${DB_NAME}' and user '${DB_USER}' ready."

# -------- 4) Backend .env (production) --------
say "Writing backend .env…"
SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"; SERVER_IP="${SERVER_IP:-127.0.0.1}"
PUBLIC_HOST="$SERVER_IP"; [[ "$SERVER_NAME" != "_" ]] && PUBLIC_HOST="$SERVER_NAME"

if [[ -f "$ENV_FILE" ]]; then
  info ".env exists — refreshing URLs/DB only, keeping SECRET_KEY"
else
  cp "$REPO_DIR/.env.example" "$ENV_FILE"
  sed -i "s|^SECRET_KEY=.*|SECRET_KEY=$(rand 32)|" "$ENV_FILE"
fi
set_env() { if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi; }
set_env ENVIRONMENT       production
set_env ALLOW_LOCAL_LOGIN true
set_env DATABASE_URL      "mysql+pymysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}"
set_env STORAGE_ROOT      "$STORAGE_ROOT"
set_env FRONTEND_URL      "http://${PUBLIC_HOST}"
set_env BACKEND_URL       "http://${PUBLIC_HOST}"
set_env CORS_ORIGINS      "http://localhost,http://${SERVER_IP}$([[ "$SERVER_NAME" != "_" ]] && echo ",http://${SERVER_NAME}")"
chmod 600 "$ENV_FILE"; chown "$SERVICE_USER":"$SERVICE_USER" "$ENV_FILE" 2>/dev/null || true

# -------- 5) Backend venv + deps --------
say "Setting up backend venv + dependencies…"
cd "$BACKEND_DIR"
[[ -d venv ]] || python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r requirements.txt
deactivate

# -------- 6) Storage dir --------
say "Preparing storage dir at $STORAGE_ROOT…"
sudo mkdir -p "$STORAGE_ROOT"/{users,shared,trash,temp}
sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$STORAGE_ROOT"

# -------- 7) Frontend build --------
say "Installing frontend deps + building…"
cd "$FRONTEND_DIR"
export VITE_API_BASE_URL="/api/v1"
if [[ -f package-lock.json ]]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
npm run build

say "Publishing dist/ → $FRONTEND_ROOT"
sudo mkdir -p "$FRONTEND_ROOT"
sudo rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_ROOT/"
sudo chown -R www-data:www-data "$FRONTEND_ROOT" 2>/dev/null || \
  sudo chown -R nginx:nginx "$FRONTEND_ROOT" 2>/dev/null || true

# -------- 8) nginx site --------
say "Writing nginx site config…"
RENDERED="$(sed -e "s|{{SERVER_NAME}}|$SERVER_NAME|g" -e "s|{{FRONTEND_ROOT}}|$FRONTEND_ROOT|g" "$SCRIPT_DIR/nginx-site.conf")"
if [[ -d /etc/nginx/sites-available ]]; then
  echo "$RENDERED" | sudo tee "/etc/nginx/sites-available/$NGINX_SITE" >/dev/null
  sudo mkdir -p /etc/nginx/sites-enabled
  sudo ln -sf "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"
  sudo rm -f /etc/nginx/sites-enabled/default || true
else
  echo "$RENDERED" | sudo tee "/etc/nginx/conf.d/$NGINX_SITE.conf" >/dev/null
  sudo sed -i 's/^\(\s*listen\s*80.*default_server\)/#\1/' /etc/nginx/nginx.conf 2>/dev/null || true
fi
if ! grep -rq "include.*sites-enabled\|include.*conf.d" /etc/nginx/nginx.conf 2>/dev/null; then
  sudo sed -i '/http\s*{/a\    include /etc/nginx/conf.d/*.conf;' /etc/nginx/nginx.conf 2>/dev/null || true
fi
say "Testing nginx config…"; sudo nginx -t
sudo systemctl enable nginx 2>/dev/null || true
sudo systemctl reload nginx || sudo systemctl restart nginx

# -------- 9) systemd backend --------
say "Installing systemd unit…"
sed -e "s|{{BACKEND_DIR}}|$BACKEND_DIR|g" -e "s|{{SERVICE_USER}}|$SERVICE_USER|g" \
    "$SCRIPT_DIR/storagehub-backend.service" \
  | sudo tee /etc/systemd/system/storagehub-backend.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable storagehub-backend
sudo systemctl restart storagehub-backend

# -------- 10) Status --------
sleep 3
say "Status:"
sudo systemctl --no-pager --lines=4 status storagehub-backend || true

echo
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  ✅ StorageHub production deploy complete${NC}"
echo
echo "  Distro:    $PRETTY"
echo "  Web:       http://$SERVER_IP/"
[[ "$SERVER_NAME" != "_" ]] && echo "  Domain:    http://$SERVER_NAME/"
echo "  API docs:  http://$SERVER_IP/docs"
echo "  Health:    http://$SERVER_IP/api/v1/health"
echo
echo "  First login: open the site and click 'Continue (Local Dev)'."
echo "  The first account becomes admin. For real prod, configure OAuth"
echo "  and set ALLOW_LOCAL_LOGIN=false in $ENV_FILE."
echo
echo "  Re-deploy after pulling changes:  ./deployment/deploy-prod.sh --update"
echo "  Backend logs:  sudo journalctl -u storagehub-backend -f"
echo
echo "  HTTPS (Let's Encrypt):"
echo "      sudo apt install -y certbot python3-certbot-nginx   # or: snap install --classic certbot"
echo "      sudo certbot --nginx -d $SERVER_NAME"
echo -e "${GREEN}=====================================================${NC}"
