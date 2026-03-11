#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Building and starting containers..."
docker compose up --build -d

echo "[2/4] Waiting for backend health endpoint..."
ATTEMPTS=0
until curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "Backend did not become healthy in time"
    docker compose logs backend --tail 80 || true
    exit 1
  fi
  sleep 2
done

echo "[3/4] Running backend checks and frontend build..."
docker compose exec -T backend python manage.py check
docker compose exec -T frontend npm run build

echo "[4/4] Smoke tests..."
curl -fsS http://localhost:8000/api/machines >/dev/null
curl -fsS http://localhost:8000/api/building/summary >/dev/null
curl -fsS http://localhost:5173 >/dev/null

echo "Done."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
