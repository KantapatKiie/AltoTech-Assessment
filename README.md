# AltoTech Full-Stack Assessment

This repository contains a complete runnable prototype for Somchai's HVAC AI operations dashboard.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Django + Django REST Framework
- Database: TimescaleDB (PostgreSQL)
- Runtime: Docker Compose

Package manager:
- Frontend uses `pnpm`

## One-Command Startup

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5432

Health endpoint:
- `GET /api/health` (checks backend and database readiness)

Or run everything (build + checks + smoke tests) using:

```bash
./run_all.sh
```

Quick stack scripts:

```bash
./up_stack.sh          # docker compose up --build -d
./up_stack.sh fast     # docker compose up -d
./down_stack.sh        # docker compose down
./smoke_test.sh        # smoke test all required endpoints
./run_all.sh           # full flow: up + checks + build + smoke
./seed_data.sh         # run seed_data in backend container
./seed_data.sh --force # clear + reseed all demo data
./run_k6.sh            # k6 smoke/perf test
```

The backend entrypoint automatically:
1. waits for DB readiness,
2. runs migrations,
3. seeds data,
4. starts the Django server.

## Project Structure

```text
backend/
  config/
  hvac/
    management/commands/seed_data.py
frontend/
  src/app/
  src/components/
    charts/
    dashboard/
  src/hooks/
  src/pages/
  src/services/
  src/styles/
  src/types/
  src/main.tsx
docker-compose.yml
DESIGN.md
PROJECT.md
run_all.sh
smoke_test.sh
up_stack.sh
down_stack.sh
k6/
run_k6.sh
```

Project overview details:
- [PROJECT.md](PROJECT.md)
- [frontend/README.md](frontend/README.md)
- [backend/README.md](backend/README.md)

## Implemented Requirements

### Problem 1 - Design
- Full design details in [DESIGN.md](DESIGN.md)
- Includes data model, API contracts, frontend architecture, and trade-offs

### Problem 2 - Build

Backend:
- Machine registry, sensor readings, AI decision models
- Seeded 3-month data window (February, March, April) at 5-minute cadence
- Manual vs AI split implemented
- Time aggregation via `time_bucket()`
- Date-range validation and error handling

Frontend:
- Structured folder design: `services`, `components`, `hooks`, `pages`, `styles`, `types`
- Tailwind-based UI with custom theme and non-template visual styling
- Building overview KPIs
- Machine status + machine detail trend
- Daily energy chart with date selection
- AI decision timeline
- Before vs after energy comparison
- Loading/error/empty states + safer API error handling

Infrastructure:
- Full Docker Compose stack
- Auto migration + auto seed on startup

### Problem 3 - Bonus
- AI Chat Assistant endpoint + UI panel
- Backend route: `POST /api/ai/chat`
- Uses local env var `ANTHROPIC_API_KEY`
- Frontend uses a floating chat widget at bottom-right

Floating chat features:
- Assistant icon uses `frontend/src/assets/icons-energy.png`
- `Clear` button to clear chat history in the floating panel
- Chat-like Q&A bubbles (question/answer timeline)
- Keyboard behavior: `Enter` to send, `Shift+Enter` for newline

Bonus behavior details:
- If Anthropic key is valid and reachable, response source is `anthropic` (real LLM call).
- If external LLM fails (invalid/expired key or provider error), system returns a data-grounded fallback summary with source `fallback`.
- Frontend consumes JSON safely and avoids the previous `Unexpected token '<'` error when non-JSON is returned.

## API Documentation

### Health
- `GET /api/health`

### Machine List
- `GET /api/machines`

### Machine Sensor Data
- `GET /api/machines/{id}/sensor-data?metric=power_kw&from=<ISO>&to=<ISO>&bucket=hour`
- `metric`: `power_kw|temperature_c|setpoint_c|speed_percent`
- `bucket`: `5m|hour|day`

### Building Summary
- `GET /api/building/summary`

### AI Decision Log
- `GET /api/ai-decisions?from=<ISO>&to=<ISO>&machine_id=<optional>`

### Before vs After
- `GET /api/energy/comparison?before_from=<ISO>&before_to=<ISO>&after_from=<ISO>&after_to=<ISO>`

### Daily Building Energy
- `GET /api/energy/daily?date=YYYY-MM-DD&bucket=hour`

### AI Chat (Bonus)
- `POST /api/ai/chat`
- JSON body:

```json
{
  "prompt": "Why was energy high yesterday?"
}
```

## Local Secrets

Store keys in `.env.local` (gitignored):

```env
ANTHROPIC_API_KEY=your_key_here
```

## Validation Run

Commands used:

```bash
docker compose up --build -d
docker compose exec -T backend python manage.py check
docker compose exec -T frontend pnpm run build
./smoke_test.sh
```

## How To Use Scripts

1. First run or after dependency changes:
```bash
./up_stack.sh
```

2. Fast start without rebuild:
```bash
./up_stack.sh fast
```

3. Full verification in one command:
```bash
./run_all.sh
```

4. Stop everything:
```bash
./down_stack.sh
```

## Notes / Trade-offs

- Timescale extension is enabled and `time_bucket()` is used for aggregation.
- Hypertable conversion is attempted in seed script and gracefully skipped if table PK constraints conflict with partitioning requirements.
- For production hardening, next steps would include explicit test suites, auth, pagination, and richer anomaly detection.

*** Recommend Scale ***
- App metrics → InfluxDB
- Product analytics → TimescaleDB
- Business data → PostgreSQL
- ## Insight >> Kafka → Flink → ClickHouse pipeline
  
