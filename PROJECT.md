# Project Overview

## Goal
This project provides an AI-assisted HVAC dashboard for building operators to monitor:
- current machine status,
- energy consumption trends,
- AI control actions,
- before-vs-after energy performance.

## Services
- `frontend` (React + TypeScript + Vite): visual dashboard and AI chat panel.
- `backend` (Django + DRF): data APIs, aggregation logic, and AI orchestration endpoint.
- `db` (TimescaleDB/PostgreSQL): machine registry, time-series sensor data, AI decisions.

## Frontend Structure
- `src/app`: top-level app entry composition.
- `src/pages`: page-level screen components.
- `src/components`: reusable UI building blocks.
- `src/services`: API clients and data services.
- `src/hooks`: stateful orchestration hooks.
- `src/styles`: global styles and Tailwind setup.
- `src/types`: shared TypeScript domain models.

## Main Data Flow
1. Seed script generates 7 days of machine readings at 5-minute intervals.
2. Backend aggregates data with `time_bucket()` for chart and KPI endpoints.
3. Frontend fetches endpoint data and renders dashboard sections.
4. AI chat sends question to backend, backend builds context from recent data, then calls Anthropic API.
5. If external LLM is unavailable, backend returns a data-grounded fallback response.

## Implemented Views
- Building overview KPIs.
- Machine status grid + selected machine trend.
- Daily energy chart.
- AI decision timeline.
- Before-vs-after comparison.
- Bonus: AI chat assistant.

## Endpoint Summary
- `GET /api/health`
- `GET /api/machines`
- `GET /api/machines/{id}/sensor-data`
- `GET /api/building/summary`
- `GET /api/ai-decisions`
- `GET /api/energy/daily`
- `GET /api/energy/comparison`
- `POST /api/ai/chat`

## Script Usage
- `./up_stack.sh` : build and start frontend/backend/database.
- `./up_stack.sh fast` : start stack without rebuild.
- `./run_all.sh` : full run + checks + smoke tests.
- `./smoke_test.sh` : API smoke tests only.
- `./down_stack.sh` : stop all containers.
