#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StorageHub — RAID setup helper (mdadm)
#
# Creates a software RAID array, formats it (ext4), and mounts it. DESTRUCTIVE:
# all data on the listed devices is erased. Intended to be run on a node/server
# to back the StorageHub storage directory.
#
# Usage:
#   sudo bash scripts/setup-raid.sh --level raid1 --devices "/dev/sdb /dev/sdc" \
#        --mount /var/lib/storagehub-node [--array /dev/md0] [--yes]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LEVEL=""; DEVICES=""; MOUNT=""; ARRAY="/dev/md0"; ASSUME_YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --level)   LEVEL="$2"; shift 2 ;;
    --devices) DEVICES="$2"; shift 2 ;;
    --mount)   MOUNT="$2"; shift 2 ;;
    --array)   ARRAY="$2"; shift 2 ;;
    --yes)     ASSUME_YES=1; shift ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
say(){ echo -e "${GREEN}==> $*${NC}"; }; warn(){ echo -e "${YELLOW}!! $*${NC}"; }
die(){ echo -e "${RED}ERROR: $*${NC}"; exit 1; }

[[ -n "$LEVEL" && -n "$DEVICES" ]] || die "Required: --level <raid0|raid1|raid5|raid6|raid10> --devices \"/dev/sdX /dev/sdY\""
[[ "$EUID" -eq 0 ]] || die "Run as root (sudo)."

# map level -> mdadm value + min devices
case "$LEVEL" in
  raid0) ML=0; MIN=2 ;; raid1) ML=1; MIN=2 ;; raid5) ML=5; MIN=3 ;;
  raid6) ML=6; MIN=4 ;; raid10) ML=10; MIN=4 ;;
  *) die "Unsupported level: $LEVEL" ;;
esac

read -r -a DEVS <<< "$DEVICES"
[[ ${#DEVS[@]} -ge $MIN ]] || die "$LEVEL needs at least $MIN devices (got ${#DEVS[@]})."
if [[ "$LEVEL" == "raid10" && $(( ${#DEVS[@]} % 2 )) -ne 0 ]]; then die "raid10 needs an even device count."; fi

command -v mdadm >/dev/null 2>&1 || {
  say "Installing mdadm…"
  if   command -v apt-get >/dev/null 2>&1; then apt-get update -y && apt-get install -y mdadm
  elif command -v dnf >/dev/null 2>&1;     then dnf install -y mdadm
  elif command -v yum >/dev/null 2>&1;     then yum install -y mdadm
  elif command -v zypper >/dev/null 2>&1;  then zypper --non-interactive install mdadm
  elif command -v pacman >/dev/null 2>&1;  then pacman -Sy --noconfirm mdadm
  else die "Install mdadm manually."; fi
}

warn "This will ERASE ALL DATA on: ${DEVS[*]}"
echo "  Array: $ARRAY   Level: $LEVEL   Devices: ${#DEVS[@]}"
[[ -n "$MOUNT" ]] && echo "  Mount: $MOUNT"
if [[ "$ASSUME_YES" != "1" ]]; then
  read -r -p "Type 'ERASE' to continue: " confirm
  [[ "$confirm" == "ERASE" ]] || { echo "Aborted."; exit 0; }
fi

say "Creating array $ARRAY ($LEVEL)…"
yes | mdadm --create "$ARRAY" --level="$ML" --raid-devices="${#DEVS[@]}" "${DEVS[@]}"

say "Formatting $ARRAY as ext4…"
mkfs.ext4 -F "$ARRAY"

# persist array config
mkdir -p /etc/mdadm 2>/dev/null || true
{ mdadm --detail --scan; } >> /etc/mdadm/mdadm.conf 2>/dev/null || \
  { mdadm --detail --scan >> /etc/mdadm.conf 2>/dev/null || true; }

if [[ -n "$MOUNT" ]]; then
  say "Mounting at $MOUNT…"
  mkdir -p "$MOUNT"
  mount "$ARRAY" "$MOUNT"
  UUID="$(blkid -s UUID -o value "$ARRAY")"
  if ! grep -q "$UUID" /etc/fstab 2>/dev/null; then
    echo "UUID=$UUID $MOUNT ext4 defaults 0 2" >> /etc/fstab
  fi
fi

say "Done."
mdadm --detail "$ARRAY" | sed -n '1,12p' || true
echo
echo "Point StorageHub at this array (node .env): STORAGE_ROOT=${MOUNT:-$ARRAY}"
echo "Then restart: sudo systemctl restart storagehub-node   # or storagehub-backend"
