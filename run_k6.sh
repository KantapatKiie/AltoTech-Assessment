#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

BASE_URL="${BASE_URL:-http://host.docker.internal:8000/api}"

echo "Running k6 smoke test against $BASE_URL"
docker run --rm -i --add-host=host.docker.internal:host-gateway grafana/k6 run -e BASE_URL="$BASE_URL" - < k6/smoke.js
