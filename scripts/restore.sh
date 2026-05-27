#!/usr/bin/env bash
# Restore Postgres + media from a dated backup.
#
# Usage: bash scripts/restore.sh <YYYYMMDD-HHMMSS>
set -euo pipefail
TS="${1:?Pass the timestamp e.g. 20260507-030000}"

ENV_FILE="/home/tredific/tredific/backend/.env"
[ -f "$ENV_FILE" ] && { set -a; source "$ENV_FILE"; set +a; }

BACKUP_DIR="${BACKUP_DIR:-/var/backups/tredific}"
DB_FILE="$BACKUP_DIR/db-$TS.dump"
MEDIA_FILE="$BACKUP_DIR/media-$TS.tar.gz"

[ -f "$DB_FILE" ] || { echo "Missing $DB_FILE"; exit 1; }

read -rp "This will OVERWRITE the current DB. Type 'yes' to continue: " ok
[ "$ok" = "yes" ] || exit 1

# Drop & recreate, then restore
DB_NAME="$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')"
sudo -u postgres dropdb --if-exists "$DB_NAME"
sudo -u postgres createdb "$DB_NAME"
pg_restore --dbname="$DATABASE_URL" --no-owner --no-privileges "$DB_FILE"
echo "✓ DB restored from $DB_FILE"

if [ -f "$MEDIA_FILE" ]; then
  tar -xzf "$MEDIA_FILE" -C /home/tredific/tredific/backend/
  echo "✓ Media restored from $MEDIA_FILE"
fi
