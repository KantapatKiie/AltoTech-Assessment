# AltoTech Full-Stack Assessment

This repository contains a complete runnable prototype for Somchai's HVAC AI operations dashboard.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Django + Django REST Framework
- Database: TimescaleDB (PostgreSQL)
- Runtime: Docker Compose

## One-Command Startup

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Database: localhost:5432

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
  src/main.tsx
  src/styles.css
docker-compose.yml
DESIGN.md
```

## Implemented Requirements

### Problem 1 - Design
- Full design details in [DESIGN.md](DESIGN.md)
- Includes data model, API contracts, frontend architecture, and trade-offs

### Problem 2 - Build

Backend:
- Machine registry, sensor readings, AI decision models
- Seeded 7-day data at 5-minute cadence
- Manual vs AI split implemented
- Time aggregation via `time_bucket()`
- Date-range validation and error handling

Frontend:
- Building overview KPIs
- Machine status + machine detail trend
- Daily energy chart with date selection
- AI decision timeline
- Before vs after energy comparison
- Loading/error/empty states

Infrastructure:
- Full Docker Compose stack
- Auto migration + auto seed on startup

### Problem 3 - Bonus
- AI Chat Assistant endpoint + UI panel
- Backend route: `POST /api/ai/chat`
- Uses local env var `ANTHROPIC_API_KEY`

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
docker compose exec -T frontend npm run build
```

## Notes / Trade-offs

- Timescale extension is enabled and `time_bucket()` is used for aggregation.
- Hypertable conversion is attempted in seed script and gracefully skipped if table PK constraints conflict with partitioning requirements.
- For production hardening, next steps would include explicit test suites, auth, pagination, and richer anomaly detection.
