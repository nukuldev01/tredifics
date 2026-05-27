#!/usr/bin/env bash
# Tredific® daily backup — Postgres dump + media archive.
#
# Usage: bash scripts/backup.sh
# Cron:  0 3 * * *  /home/tredific/tredific/scripts/backup.sh >> /var/log/tredific-backup.log 2>&1
set -euo pipefail

# Load DATABASE_URL + remote sync target from the backend .env
ENV_FILE="/home/tredific/tredific/backend/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tredific}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
MEDIA_DIR="/home/tredific/tredific/backend/media"
TS="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "[$(date -Is)] Starting backup → $BACKUP_DIR"

# Postgres dump
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump --dbname="$DATABASE_URL" --format=custom \
    --file="$BACKUP_DIR/db-$TS.dump"
  echo "  ✓ DB dump: db-$TS.dump"
else
  echo "  ! DATABASE_URL not set; skipping DB dump"
fi

# Media archive
if [ -d "$MEDIA_DIR" ]; then
  tar -czf "$BACKUP_DIR/media-$TS.tar.gz" -C "$(dirname "$MEDIA_DIR")" \
      "$(basename "$MEDIA_DIR")"
  echo "  ✓ Media archive: media-$TS.tar.gz"
fi

# Optional offsite sync — set BACKUP_REMOTE in .env to e.g. s3:my-bucket/tredific
# or your-rclone-remote:tredific-backups
if [ -n "${BACKUP_REMOTE:-}" ] && command -v rclone >/dev/null; then
  rclone copy "$BACKUP_DIR" "$BACKUP_REMOTE" --max-age "${RETENTION_DAYS}d" \
    --quiet
  echo "  ✓ Synced to $BACKUP_REMOTE"
fi

# Prune local files older than retention window
find "$BACKUP_DIR" -type f -mtime "+$RETENTION_DAYS" -delete
echo "  ✓ Pruned files older than $RETENTION_DAYS days"
echo "[$(date -Is)] Backup complete."
