#!/usr/bin/env bash
# Tredific® zero-downtime deploy.
#
# Run from /home/tredific/tredific (the project root).
# Usage: bash scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[deploy] Pulling latest…"
git pull --ff-only

echo "[deploy] Backend…"
cd backend
source .venv/bin/activate
pip install -q -r requirements.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
deactivate
cd ..

echo "[deploy] Frontend…"
cd frontend
npm ci --silent
npm run build
cd ..

echo "[deploy] Restarting services…"
sudo systemctl restart tredific-api
sudo systemctl restart tredific-web
sleep 3
curl -fsS https://api.tredific.com/healthz >/dev/null && echo "  ✓ API healthy"
curl -fsS https://tredific.com/ -o /dev/null && echo "  ✓ Web healthy"

echo "[deploy] Done."
