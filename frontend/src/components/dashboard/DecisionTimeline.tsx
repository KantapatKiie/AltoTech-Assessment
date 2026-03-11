import type { AIDecision } from "../../types/dashboard";

type Props = { decisions: AIDecision[] };

export function DecisionTimeline({ decisions }: Props) {
  if (decisions.length === 0) {
    return <div className="rounded-xl bg-cloud/70 p-6 text-slate-500">No decisions in this period</div>;
  }

  return (
    <div className="grid max-h-72 gap-2 overflow-auto pr-1">
      {decisions.map((d) => (
        <article key={d.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">{new Date(d.timestamp).toLocaleString()}</p>
          <p className="mt-1 text-sm font-medium text-slateink">
            {d.machine.name} - {d.action_type} {d.action_value}
          </p>
          <p className="text-xs text-slate-600">{d.reason}</p>
        </article>
      ))}
    </div>
  );
}
