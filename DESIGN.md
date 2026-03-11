# DESIGN.md

## 1. System Architecture

```text
React (Vite + TS)  --->  Django REST API  --->  TimescaleDB (PostgreSQL)
      |                        |                      |
      |                        |                      +-- Time-series storage (sensor readings)
      |                        +-- Aggregation / business endpoints
      +-- Dashboard + charts + timeline + AI chat UI
```

- Frontend calls backend REST endpoints only.
- Backend owns data shaping, validation, aggregation, and AI chat orchestration.
- Database stores machine registry, sensor events, and AI decision logs.

## 2. Data Model

### 2.1 machines
- id (PK)
- name (unique)
- machine_type (`ac_large`, `ac_small`, `fan`)
- zone
- rated_power_kw

### 2.2 sensor_readings (`hvac_sensorreading`)
- id (PK)
- machine_id (FK -> machines)
- timestamp (indexed)
- power_kw
- temperature_c (nullable)
- setpoint_c (nullable)
- speed_percent (nullable)
- is_on

Indexes:
- `(machine_id, timestamp)` for per-machine time-range scans
- `(timestamp)` for building-wide range scans and aggregation

### 2.3 ai_decisions
- id (PK)
- machine_id (FK -> machines)
- timestamp (indexed)
- action_type
- action_value
- reason

## 3. Query Patterns and Rationale

Main read patterns:
1. Latest status per machine for machine cards.
2. Aggregated historical series by machine and metric for charts.
3. Building-wide energy rollups by day/hour.
4. Chronological AI decision feed.
5. Before-vs-after energy comparison.

Implementation strategy:
- Latest status: Django `Subquery` annotations on latest `sensor_reading` per machine.
- Time-series charts: SQL `time_bucket()` aggregation.
- Energy comparison: SQL `SUM(power_kw)` converted to kWh via 5-minute cadence factor `(5/60)`.

## 4. API Design

### 4.1 Machine List
- `GET /api/machines`
- Returns metadata + latest status snapshot for each machine.

### 4.2 Machine Sensor Data
- `GET /api/machines/{id}/sensor-data?metric=&from=&to=&bucket=`
- Metrics: `power_kw`, `temperature_c`, `setpoint_c`, `speed_percent`
- Buckets: `5m`, `hour`, `day`
- Uses `time_bucket()` aggregation.

### 4.3 Building Summary
- `GET /api/building/summary`
- Returns total current power, active machines, average temperature, today energy, yesterday energy, trend flag.

### 4.4 AI Decision Timeline
- `GET /api/ai-decisions?from=&to=&machine_id=`
- Chronological feed of AI actions and reasons.

### 4.5 Before vs After Comparison
- `GET /api/energy/comparison?before_from=&before_to=&after_from=&after_to=`
- Returns before/after kWh, delta, and savings percentage.

### 4.6 Daily Building Energy Chart
- `GET /api/energy/daily?date=YYYY-MM-DD&bucket=hour`
- Aggregated building energy over selected date.

### 4.7 Bonus: AI Chat Assistant
- `POST /api/ai/chat`
- Body: `{ "prompt": "..." }`
- Backend assembles context from latest energy and decisions, then calls Anthropic.

## 5. Frontend Component Design

Top-level sections:
1. Hero + status context
2. KPI cards (overview)
3. Machine status grid + selected machine detail chart
4. Daily energy chart with date selector
5. AI decision timeline
6. Before-vs-after comparison cards
7. AI chat assistant panel

State approach:
- Page-level React state with targeted effects.
- Shared fetch helper (`apiGet`) for JSON endpoints.
- Selected machine and selected date drive dependent queries.

Reusable view primitives:
- `SimpleLineChart` for series rendering
- card/panel UI patterns in shared CSS classes

## 6. Data Simulation Strategy

Duration and cadence:
- 7 days, 5-minute intervals.

Split:
- Days 1-3: manual operation (higher baseline energy).
- Days 4-7: AI control (reduced baseline + selective machine OFF windows).

AI decisions:
- 8-9 per AI day with realistic action templates:
  - startup ON
  - setpoint adjustments
  - occupancy-based OFF
  - evening shutdown / night mode

## 7. Trade-offs

1. Timescale hypertable conversion can fail when Django PK constraints conflict with partition requirements.
- Current implementation enables Timescale extension and uses `time_bucket()`.
- Hypertable conversion is attempted and gracefully skipped if PK constraints prevent conversion.

2. Dashboard uses a custom SVG line chart.
- Fast to implement and dependency-light.
- Limited compared to richer chart libraries.

3. AI chat prompt context is concise.
- Keeps request small and fast.
- Could be improved with richer retrieval and per-zone analytics.

## 8. Future Improvements

1. Use a dedicated hypertable table design with composite primary key including `timestamp`.
2. Add unit tests for API calculations and date-range validation.
3. Add pagination for machine and decision endpoints.
4. Add alerting engine (high-power anomaly, drift from setpoint).
5. Add PDF export report for weekly/monthly management reporting.
