import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Machine = {
  id: number;
  name: string;
  machine_type: string;
  zone: string;
  rated_power_kw: number;
  current: {
    power_kw: number | null;
    temperature_c: number | null;
    setpoint_c: number | null;
    speed_percent: number | null;
    is_on: boolean | null;
    timestamp: string | null;
  };
};

type Summary = {
  total_power_kw: number;
  active_machines: number;
  average_temperature_c: number | null;
  today_energy_kwh: number;
  yesterday_energy_kwh: number;
  is_trending_higher_than_yesterday: boolean;
};

type EnergyPoint = {
  timestamp: string;
  energy_kwh: number;
};

type SensorPoint = {
  timestamp: string;
  value: number;
};

type AIDecision = {
  id: number;
  timestamp: string;
  action_type: string;
  action_value: string;
  reason: string;
  machine: {
    id: number;
    name: string;
  };
};

type Comparison = {
  before_kwh: number;
  after_kwh: number;
  delta_kwh: number;
  savings_percent: number;
};

const API_BASE =
  (import.meta as unknown as { env: { VITE_API_BASE?: string } }).env.VITE_API_BASE ||
  "http://localhost:8000/api";

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function SimpleLineChart({ points, valueKey }: { points: Array<Record<string, unknown>>; valueKey: string }) {
  const width = 740;
  const height = 220;
  if (points.length === 0) {
    return <div className="empty">No data in selected range</div>;
  }

  const values = points
    .map((p) => Number(p[valueKey]))
    .filter((v) => Number.isFinite(v));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * (width - 20) + 10;
      const y = height - ((Number(point[valueKey]) - min) / range) * (height - 20) - 10;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
      <path d={path} fill="none" stroke="#1a6dff" strokeWidth="3" />
    </svg>
  );
}

function toLocalDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyEnergy, setDailyEnergy] = useState<EnergyPoint[]>([]);
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [machineSeries, setMachineSeries] = useState<SensorPoint[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateInput(new Date()));
  const [chatPrompt, setChatPrompt] = useState<string>("เมื่อวานพลังงานสูงเพราะอะไร");
  const [chatAnswer, setChatAnswer] = useState<string>("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === selectedMachineId) || null,
    [machines, selectedMachineId]
  );

  const loadAll = async () => {
    try {
      setError("");
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();
      const beforeFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const beforeTo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
      const afterFrom = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
      const afterTo = now.toISOString();

      const [machineRes, summaryRes, dailyRes, decisionsRes, compareRes] = await Promise.all([
        apiGet<{ items: Machine[] }>("/machines"),
        apiGet<Summary>("/building/summary"),
        apiGet<{ points: EnergyPoint[] }>(`/energy/daily?date=${selectedDate}&bucket=hour`),
        apiGet<{ items: AIDecision[] }>(`/ai-decisions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        apiGet<Comparison>(
          `/energy/comparison?before_from=${encodeURIComponent(beforeFrom)}&before_to=${encodeURIComponent(
            beforeTo
          )}&after_from=${encodeURIComponent(afterFrom)}&after_to=${encodeURIComponent(afterTo)}`
        ),
      ]);

      setMachines(machineRes.items);
      setSummary(summaryRes);
      setDailyEnergy(dailyRes.points);
      setDecisions(decisionsRes.items);
      setComparison(compareRes);
      if (!selectedMachineId && machineRes.items.length > 0) {
        setSelectedMachineId(machineRes.items[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedMachineId) return;
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();
    apiGet<{ points: SensorPoint[] }>(
      `/machines/${selectedMachineId}/sensor-data?metric=power_kw&bucket=hour&from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`
    )
      .then((res) => setMachineSeries(res.points))
      .catch((e: Error) => setError(e.message));
  }, [selectedMachineId]);

  const askAI = async () => {
    try {
      setLoadingChat(true);
      setChatAnswer("");
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: chatPrompt }),
      });
      const data = (await response.json()) as { answer?: string; detail?: string };
      if (!response.ok) {
        throw new Error(data.detail || "AI chat failed");
      }
      setChatAnswer(data.answer || "No answer");
    } catch (e) {
      setChatAnswer(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <main className="app">
      <header className="hero">
        <h1>Somchai AI Operations Console</h1>
        <p>Monitoring every machine, every decision, and every kWh in one view.</p>
      </header>

      {error ? <div className="error">{error}</div> : null}

      {summary ? (
        <section className="kpi-grid">
          <article className="kpi-card">
            <h3>Total Power</h3>
            <strong>{summary.total_power_kw.toFixed(2)} kW</strong>
          </article>
          <article className="kpi-card">
            <h3>Machines Running</h3>
            <strong>{summary.active_machines}</strong>
          </article>
          <article className="kpi-card">
            <h3>Avg Temperature</h3>
            <strong>{summary.average_temperature_c ?? "-"} C</strong>
          </article>
          <article className="kpi-card">
            <h3>Today Energy</h3>
            <strong>{summary.today_energy_kwh.toFixed(2)} kWh</strong>
            <small className={summary.is_trending_higher_than_yesterday ? "trend-up" : "trend-down"}>
              vs yesterday: {summary.yesterday_energy_kwh.toFixed(2)} kWh
            </small>
          </article>
        </section>
      ) : (
        <div className="empty">Loading building summary...</div>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Machine Status</h2>
        </div>
        <div className="machine-grid">
          {machines.map((machine) => (
            <button
              className={`machine-card ${machine.id === selectedMachineId ? "active" : ""}`}
              key={machine.id}
              onClick={() => setSelectedMachineId(machine.id)}
            >
              <h4>{machine.name}</h4>
              <p>{machine.zone}</p>
              <p>{machine.current.is_on ? "ON" : "OFF"}</p>
              <p>{machine.current.power_kw?.toFixed(2) ?? "0.00"} kW</p>
            </button>
          ))}
        </div>
        <div className="detail-panel">
          <h3>{selectedMachine ? `${selectedMachine.name} Power Trend (24h)` : "Select a machine"}</h3>
          <SimpleLineChart points={machineSeries as unknown as Array<Record<string, unknown>>} valueKey="value" />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Daily Energy Chart</h2>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <SimpleLineChart points={dailyEnergy as unknown as Array<Record<string, unknown>>} valueKey="energy_kwh" />
      </section>

      <section className="panel">
        <h2>AI Decision Timeline (Last 24h)</h2>
        <div className="timeline">
          {decisions.length === 0 ? (
            <div className="empty">No decisions in this period</div>
          ) : (
            decisions.map((d) => (
              <article className="timeline-item" key={d.id}>
                <strong>{new Date(d.timestamp).toLocaleString()}</strong>
                <p>
                  {d.machine.name} - {d.action_type} {d.action_value}
                </p>
                <small>{d.reason}</small>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel compare">
        <h2>Before vs After (Manual vs AI)</h2>
        {comparison ? (
          <div className="compare-grid">
            <article>
              <h4>Before (Days 1-3)</h4>
              <strong>{comparison.before_kwh.toFixed(2)} kWh</strong>
            </article>
            <article>
              <h4>After (Days 4-7)</h4>
              <strong>{comparison.after_kwh.toFixed(2)} kWh</strong>
            </article>
            <article>
              <h4>Savings</h4>
              <strong>{comparison.savings_percent.toFixed(2)}%</strong>
            </article>
          </div>
        ) : (
          <div className="empty">Loading comparison...</div>
        )}
      </section>

      <section className="panel">
        <h2>AI Chat Assistant (Bonus)</h2>
        <div className="chat-row">
          <input value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)} />
          <button onClick={askAI} disabled={loadingChat}>
            {loadingChat ? "Asking..." : "Ask"}
          </button>
        </div>
        <div className="chat-answer">{chatAnswer || "Type a question about energy or AI decisions."}</div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
