import { LineChart } from "../components/charts/LineChart";
import { ChatAssistantPanel } from "../components/dashboard/ChatAssistantPanel";
import { ComparisonPanel } from "../components/dashboard/ComparisonPanel";
import { DecisionTimeline } from "../components/dashboard/DecisionTimeline";
import { MachineGrid } from "../components/dashboard/MachineGrid";
import { StatCard } from "../components/dashboard/StatCard";
import { useDashboardData } from "../hooks/useDashboardData";

export function DashboardPage() {
  const {
    machines,
    summary,
    dailyEnergy,
    decisions,
    comparison,
    selectedMachine,
    selectedMachineId,
    setSelectedMachineId,
    machineSeries,
    selectedDate,
    setSelectedDate,
    chatPrompt,
    setChatPrompt,
    chatAnswer,
    chatSource,
    chatMeta,
    loadingChat,
    askAI,
    error,
  } = useDashboardData();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-5 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-3xl bg-slateink p-8 text-white">
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-cobalt/40 blur-2xl" />
        <div className="absolute bottom-0 right-16 h-24 w-24 rounded-full bg-mintline/30 blur-xl" />
        <h1 className="relative text-4xl font-bold tracking-tight">Energy Operations Studio</h1>
        <p className="relative mt-2 max-w-2xl text-sm text-blue-100">
          Observe machine states, AI control actions, and building energy impact in one command center.
        </p>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Power" value={`${summary.total_power_kw.toFixed(2)} kW`} />
          <StatCard title="Machines Running" value={`${summary.active_machines}`} />
          <StatCard title="Avg Temperature" value={`${summary.average_temperature_c ?? "-"} C`} />
          <StatCard
            title="Today Energy"
            value={`${summary.today_energy_kwh.toFixed(2)} kWh`}
            meta={`vs yesterday ${summary.yesterday_energy_kwh.toFixed(2)} kWh`}
            metaClassName={summary.is_trending_higher_than_yesterday ? "text-red-600" : "text-emerald-600"}
          />
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <h2 className="text-xl font-semibold text-slateink">Machine Status</h2>
        <div className="mt-3">
          <MachineGrid
            machines={machines}
            selectedMachineId={selectedMachineId}
            onSelect={(id) => setSelectedMachineId(id)}
          />
        </div>
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-slate-600">
            {selectedMachine ? `${selectedMachine.name} Power Trend (24h)` : "Select a machine"}
          </h3>
          <LineChart points={machineSeries as unknown as Array<Record<string, unknown>>} valueKey="value" />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slateink">Daily Energy</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <LineChart points={dailyEnergy as unknown as Array<Record<string, unknown>>} valueKey="energy_kwh" />
      </section>

      <section className="grid gap-4 xl:grid-cols-ๅ">
        <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
          <h2 className="mb-3 text-xl font-semibold text-slateink">AI Decision Timeline</h2>
          <DecisionTimeline decisions={decisions} />
        </section>

        <section className="space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
            <h2 className="mb-3 text-xl font-semibold text-slateink">Before vs After</h2>
            <ComparisonPanel comparison={comparison} />
          </section>
        </section>
      </section>

      <ChatAssistantPanel
        prompt={chatPrompt}
        setPrompt={setChatPrompt}
        loading={loadingChat}
        answer={chatAnswer}
        source={chatSource}
        meta={chatMeta}
        onAsk={askAI}
      />
    </main>
  );
}
