#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — STORAGE NODE installer (backend only)
#
# A node runs ONLY the backend (API + storage). The frontend stays on the main
# server. Nodes use a local SQLite DB, so there is NO MySQL/Node.js/Nginx to set
# up — install is intentionally minimal.
#
# Usage:
#   sudo bash deployment/deploy-node.sh
#   STORAGE_ROOT=/mnt/raid NODE_PORT=8001 sudo bash deployment/deploy-node.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"

STORAGE_ROOT="${STORAGE_ROOT:-/var/lib/storagehub-node}"
NODE_PORT="${NODE_PORT:-8000}"
SERVICE_USER="${SERVICE_USER:-${SUDO_USER:-$(id -un)}}"

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
say(){ echo -e "${GREEN}==> $*${NC}"; }; info(){ echo -e "${BLUE}ℹ  $*${NC}"; }
die(){ echo -e "${RED}ERROR: $*${NC}"; exit 1; }
rand(){ if command -v openssl >/dev/null 2>&1; then openssl rand -hex "${1:-24}"; else head -c "${1:-24}" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi; }

[[ -f /etc/os-release ]] || die "Unsupported OS."
if   command -v apt-get >/dev/null 2>&1; then PKG=apt
elif command -v dnf >/dev/null 2>&1;     then PKG=dnf
elif command -v yum >/dev/null 2>&1;     then PKG=yum
elif command -v zypper >/dev/null 2>&1;  then PKG=zypper
elif command -v pacman >/dev/null 2>&1;  then PKG=pacman
else die "No supported package manager."; fi
export DEBIAN_FRONTEND=noninteractive

say "Installing minimal backend dependencies ($PKG)…"
case "$PKG" in
  apt)    sudo apt-get update -y && sudo apt-get install -y --no-install-recommends python3 python3-venv python3-pip python3-dev build-essential libffi-dev curl git ;;
  dnf|yum) sudo $PKG install -y python3 python3-pip python3-devel gcc gcc-c++ make libffi-devel curl git ;;
  zypper) sudo zypper --non-interactive install python3 python3-pip python3-devel gcc gcc-c++ make libffi-devel curl git ;;
  pacman) sudo pacman -Sy --noconfirm python python-pip base-devel libffi curl git ;;
esac

say "Backend venv + dependencies…"
cd "$BACKEND_DIR"
[[ -d venv ]] || python3 -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip setuptools wheel
pip install --quiet -r requirements.txt
deactivate

say "Preparing storage at $STORAGE_ROOT…"
sudo mkdir -p "$STORAGE_ROOT"/{users,shared,trash,temp}
sudo chown -R "$SERVICE_USER":"$SERVICE_USER" "$STORAGE_ROOT"

say "Writing node .env (SQLite, no MySQL needed)…"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$REPO_DIR/.env.example" "$ENV_FILE"
  sed -i "s|^SECRET_KEY=.*|SECRET_KEY=$(rand 32)|" "$ENV_FILE"
fi
set_env(){ if grep -q "^$1=" "$ENV_FILE"; then sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi; }
set_env ENVIRONMENT       production
set_env ALLOW_LOCAL_LOGIN true
set_env DATABASE_URL      "sqlite+pysqlite:///$STORAGE_ROOT/node.db"
set_env STORAGE_ROOT      "$STORAGE_ROOT"
chmod 600 "$ENV_FILE"; chown "$SERVICE_USER":"$SERVICE_USER" "$ENV_FILE" 2>/dev/null || true

say "Installing systemd service (binds 0.0.0.0:$NODE_PORT)…"
sudo tee /etc/systemd/system/storagehub-node.service >/dev/null <<UNIT
[Unit]
Description=StorageHub storage node (backend only)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $NODE_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable storagehub-node
sudo systemctl restart storagehub-node
sleep 2
sudo systemctl --no-pager --lines=4 status storagehub-node || true

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"; IP="${IP:-127.0.0.1}"
echo
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  ✅ Storage node ready${NC}"
echo "  Node API:   http://$IP:$NODE_PORT/api/v1/health"
echo "  Storage:    $STORAGE_ROOT"
echo
echo "  Register it on the MAIN server:"
echo "    Admin → Storage & Nodes → Add node"
echo "      type     = remote"
echo "      location = http://$IP:$NODE_PORT"
echo
echo "  Configure RAID for this node's storage (optional):"
echo "    sudo bash scripts/setup-raid.sh --level raid1 --devices \"/dev/sdb /dev/sdc\" --mount $STORAGE_ROOT"
echo "  Logs: sudo journalctl -u storagehub-node -f"
echo -e "${GREEN}=====================================================${NC}"
