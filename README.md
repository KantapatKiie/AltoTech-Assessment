# AltoTech Assessment Master Plan (Finish Today)

## 1) Mission

Build a complete Human-Machine Interface dashboard for Somchai to monitor building cooling operations and AI optimization outcomes.

Required stack:

- React + TypeScript
- Django REST Framework
- TimescaleDB

Primary success condition:

- Reviewer can run one command: `docker-compose up --build`
- System starts fully and dashboard shows live API-backed data.

## 2) What Must Be Delivered

### Problem 1 - System Design (20%)

- TimescaleDB schema design:
  - machines
  - sensor_readings (time-series every 5 minutes)
  - ai_decisions
- REST API design:
  - machine list
  - sensor history with time-range + bucket aggregation
  - building summary
  - AI decision log
  - before vs after energy comparison
- Frontend architecture:
  - layout/navigation
  - data fetching pattern and caching strategy
  - reusable components
  - state management

Output file:

- `DESIGN.md`

### Problem 2 - Build It (Core)

Backend:

- Implement schema and indexes for fast time-range queries.
- Use TimescaleDB hypertable and `time_bucket()` aggregation.
- Seed 7 days of realistic data at 5-minute intervals.
- Seed AI decision logs.

Frontend:

- Building Overview (KPI cards)
- Machine Status list/table + per-machine detail
- Daily Energy Chart
- AI Decision Timeline
- Before vs After comparison
- Include loading, empty, and error states

Infrastructure:

- Dockerized TimescaleDB + Django + React
- Auto migration + auto seeding
- Starts from one command only

### Problem 3 - Optional Bonus (10%)

Choose one feature (recommended to maximize score):

- AI Chat Assistant (LLM)
- One-click PDF report
- Smart Alerts
- Custom feature

**For LLM integration, keep API keys in local environment variables only (for example: `.env.local`) and never commit keys to git.**

## 3) Must-Have Acceptance Criteria (Non-Negotiable)

- `docker-compose up --build` works without manual setup.
- Dashboard data comes from API (no hardcoded metrics).
- API responses are structured and correct.
- TypeScript compile is clean.
- `DESIGN.md` clearly explains design and trade-offs.
- `README.md` includes setup, architecture, API docs, and trade-offs.

## 4) Data Rules to Make Demo Credible

- Machine types: Large AC, Small AC, Ventilation Fan.
- Sensor cadence: every 5 minutes.
- AI decisions: around 8-12 decisions/day during AI period.
- Period split:
  - Day 1-3: Manual operation, higher energy, no AI decisions.
  - Day 4-7: AI control, around 15% lower energy, AI logs present.

Suggested realistic behavior:

- 00:00-06:00 minimal critical machines
- 06:00-08:00 startup
- 08:00-18:00 peak operation
- 18:00-22:00 wind-down
- 22:00-00:00 night mode

## 5) Today Execution Schedule (Practical)

### Block A (1-2h): Bootstrap

- Scaffold backend and frontend projects.
- Create docker-compose stack.
- Verify all services boot.

### Block B (2h): Data Layer

- Implement models and migrations.
- Create hypertable and indexes.
- Build seed script for 7-day data and AI logs.

### Block C (2h): API Layer

- Implement required endpoints.
- Add query validation and error handling.
- Implement bucket options: 5m/hour/day.

### Block D (3h): Frontend Layer

- Build all required pages/components.
- Integrate API services.
- Add loading/error/empty states.

### Block E (1-1.5h): Bonus

- Add AI Chat Assistant using Anthropic via backend proxy endpoint.
- Keep API key in environment variables only.

### Block F (1h): Finalize

- Write `DESIGN.md` and complete `README.md`.
- Validate from clean start with docker compose.
- Prepare final submission notes.

## 6) Endpoint Contract Checklist

- `GET /api/machines`
- `GET /api/machines/{id}/sensor-data?metric=&from=&to=&bucket=`
- `GET /api/building/summary`
- `GET /api/ai-decisions?from=&to=&machine_id=`
- `GET /api/energy/comparison?before_from=&before_to=&after_from=&after_to=`

Expected behavior:

- Invalid date range returns clear validation error.
- Missing machine returns 404.
- Empty result sets return valid empty arrays + metadata.

## 7) QA Checklist Before Submission

- Backend
  - Migrations run automatically.
  - Seed runs automatically once.
  - Aggregations match expected values.
- Frontend
  - No TypeScript errors.
  - Charts render correctly with API data.
  - All required views are navigable.
- Infra
  - New clone can run in one command.
- Docs
  - `DESIGN.md` and `README.md` are complete and clear.

## 8) Security Notes

- Keep credentials in ignored local files and environment variables.
- Do not commit API keys.
- Rotate temporary keys after submission.

## 9) Current Repository Notes

- Existing markdown content has been consolidated into this master plan.
- Use this file as single source of truth for finishing the assessment today.
