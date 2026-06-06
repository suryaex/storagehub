#!/usr/bin/env bash
# Back up the MySQL database and storage directory.
set -euo pipefail
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${1:-./backups}"
mkdir -p "$OUT"

echo "Dumping database..."
docker compose exec -T mysql mysqldump -ustoragehub -pstoragehub storagehub > "${OUT}/db-${STAMP}.sql"

echo "Archiving storage volume..."
docker run --rm -v storagehub_storage_data:/data -v "$(pwd)/${OUT}":/backup alpine \
  tar czf "/backup/storage-${STAMP}.tar.gz" -C /data .

echo "Backup written to ${OUT}"
