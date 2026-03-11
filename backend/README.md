# Backend

Django REST API for HVAC monitoring, AI decisions, and energy analytics.

## Run (inside docker)

```bash
python manage.py migrate
python manage.py seed_data --force
python manage.py runserver 0.0.0.0:8000
```

## Healthcheck
- `GET /api/health`
- Returns backend and database readiness.

## Seed Data
- Generates February, March, April data (5-minute intervals).
- Recent period includes AI decisions and lower-energy behavior.

Command:

```bash
python manage.py seed_data --force
```

## Main Endpoints
- `GET /api/machines`
- `GET /api/machines/{id}/sensor-data`
- `GET /api/building/summary`
- `GET /api/ai-decisions`
- `GET /api/energy/daily`
- `GET /api/energy/comparison`
- `POST /api/ai/chat`
