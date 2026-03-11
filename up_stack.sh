#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

MODE="${1:-build}"
if [ "$MODE" = "build" ]; then
  echo "Starting stack with build..."
  docker compose up --build -d
else
  echo "Starting stack without rebuild..."
  docker compose up -d
fi

echo "Waiting for backend health..."
ATTEMPTS=0
until curl -fsS http://localhost:8000/api/health >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "Backend is not ready after 60 seconds"
    docker compose logs backend --tail 80 || true
    exit 1
  fi
  sleep 2
done

echo "Stack is ready"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
