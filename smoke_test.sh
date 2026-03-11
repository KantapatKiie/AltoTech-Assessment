#!/usr/bin/env sh
set -eu

BASE_API="http://localhost:8000/api"

NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
FROM_24H="$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ)"
BEFORE_FROM="$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)"
BEFORE_TO="$(date -u -v-4d +%Y-%m-%dT%H:%M:%SZ)"
AFTER_FROM="$(date -u -v-4d +%Y-%m-%dT%H:%M:%SZ)"
TODAY="$(date +%Y-%m-%d)"

curl -fsS "$BASE_API/health" >/dev/null
curl -fsS "$BASE_API/machines" >/dev/null
curl -fsS "$BASE_API/machines/1/sensor-data?metric=power_kw&bucket=hour&from=$FROM_24H&to=$NOW" >/dev/null
curl -fsS "$BASE_API/building/summary" >/dev/null
curl -fsS "$BASE_API/ai-decisions?from=$FROM_24H&to=$NOW" >/dev/null
curl -fsS "$BASE_API/energy/daily?date=$TODAY&bucket=hour" >/dev/null
curl -fsS "$BASE_API/energy/comparison?before_from=$BEFORE_FROM&before_to=$BEFORE_TO&after_from=$AFTER_FROM&after_to=$NOW" >/dev/null

echo "Smoke tests passed"
