import type { Comparison } from "../../types/dashboard";

type Props = { comparison: Comparison | null };

export function ComparisonPanel({ comparison }: Props) {
  if (!comparison) {
    return <div className="rounded-xl bg-cloud/70 p-6 text-slate-500">Loading comparison...</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
        <p className="text-sm text-slate-500">Before (Days 1-3)</p>
        <p className="mt-1 text-xl font-semibold text-slateink">{comparison.before_kwh.toFixed(2)} kWh</p>
      </article>
      <article className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
        <p className="text-sm text-slate-500">After (Days 4-7)</p>
        <p className="mt-1 text-xl font-semibold text-slateink">{comparison.after_kwh.toFixed(2)} kWh</p>
      </article>
      <article className="rounded-xl bg-slateink p-4 text-white">
        <p className="text-sm text-blue-100">Savings</p>
        <p className="mt-1 text-xl font-semibold">{comparison.savings_percent.toFixed(2)}%</p>
      </article>
    </div>
  );
}
