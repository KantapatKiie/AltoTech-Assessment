#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

SEED_ARGS="${1:-}"

# Ensure required services are available before running Django management command.
docker compose up -d db backend

if [ "$SEED_ARGS" = "--force" ]; then
  echo "Running seed_data with --force"
  docker compose exec -T backend python manage.py seed_data --force
else
  echo "Running seed_data"
  docker compose exec -T backend python manage.py seed_data
fi
