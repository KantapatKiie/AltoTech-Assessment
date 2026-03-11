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

## Main Data Flow
1. Seed script generates 7 days of machine readings at 5-minute intervals.
2. Backend aggregates data with `time_bucket()` for chart and KPI endpoints.
3. Frontend fetches endpoint data and renders dashboard sections.
4. AI chat sends question to backend, backend builds context from recent data, then calls Anthropic API.

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
