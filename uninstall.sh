#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — uninstaller (Docker stack AND/OR bare-metal install)
#
# Run before a major update or to switch versions.
#
# Usage:
#   sudo bash uninstall.sh           # stop + remove, KEEP data (DB + files)
#   sudo bash uninstall.sh --purge   # ALSO delete DB, uploaded files, volumes
#   sudo bash uninstall.sh --yes     # no confirmation prompt
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say()  { echo -e "${GREEN}==> $*${NC}"; }
warn() { echo -e "${YELLOW}!! $*${NC}"; }

PURGE=0; ASSUME_YES=0
for a in "$@"; do case "$a" in
  --purge) PURGE=1 ;;
  --yes|-y) ASSUME_YES=1 ;;
esac; done

if [[ "$ASSUME_YES" != "1" ]]; then
  echo "This will stop and remove StorageHub from this machine."
  [[ "$PURGE" == "1" ]] && echo -e "${RED}--purge: the database, ALL uploaded files and Docker volumes will be DELETED.${NC}"
  read -r -p "Type 'yes' to continue: " c; [[ "$c" == "yes" ]] || { echo "Aborted."; exit 0; }
fi

# ───────────────── Docker stack ─────────────────
COMPOSE=""
if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose"
elif sudo docker compose version >/dev/null 2>&1; then COMPOSE="sudo docker compose"
elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"; fi

if [[ -n "$COMPOSE" && -f docker-compose.yml ]]; then
  if $COMPOSE ps >/dev/null 2>&1; then
    say "Stopping Docker stack…"
    if [[ "$PURGE" == "1" ]]; then
      $COMPOSE -f docker-compose.yml down -v --remove-orphans || true
      warn "Docker volumes (mysql_data, storage_data) deleted."
    else
      $COMPOSE -f docker-compose.yml down --remove-orphans || true
      say "Volumes kept (mysql_data, storage_data). Use --purge to delete."
    fi
  fi
fi

# ───────────────── Bare-metal install ─────────────────
stop_disable() {
  command -v systemctl >/dev/null 2>&1 && { sudo systemctl stop "$1" 2>/dev/null || true; sudo systemctl disable "$1" 2>/dev/null || true; }
}

if [[ -e /etc/systemd/system/storagehub-backend.service ]] \
   || [[ -e /etc/systemd/system/storagehub-node.service ]] \
   || [[ -d /var/www/storagehub ]]; then
  say "Removing bare-metal install…"
  stop_disable storagehub-backend
  stop_disable storagehub-node
  sudo rm -f /etc/systemd/system/storagehub-backend.service
  sudo rm -f /etc/systemd/system/storagehub-node.service
  sudo systemctl daemon-reload 2>/dev/null || true

  sudo rm -f /etc/nginx/sites-enabled/storagehub /etc/nginx/sites-available/storagehub
  sudo rm -f /etc/nginx/conf.d/storagehub.conf
  if command -v nginx >/dev/null 2>&1; then
    sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
  fi

  sudo rm -rf /var/www/storagehub

  if [[ "$PURGE" == "1" ]]; then
    warn "Purging storage dir + database…"
    sudo rm -rf /var/lib/storagehub /var/lib/storagehub-node 2>/dev/null || true
    if command -v mysql >/dev/null 2>&1; then
      sudo mysql -e "DROP DATABASE IF EXISTS storagehub; DROP USER IF EXISTS 'storagehub'@'localhost';" 2>/dev/null \
        && warn "Dropped database 'storagehub' and its user." \
        || warn "Could not drop DB automatically — do it manually if needed."
    fi
  else
    say "Storage dir + database kept. Use --purge to delete them."
  fi
fi

say "StorageHub uninstall complete."
