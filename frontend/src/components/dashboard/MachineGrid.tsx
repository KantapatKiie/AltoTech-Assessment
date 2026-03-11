import type { Machine } from "../../types/dashboard";

type Props = {
  machines: Machine[];
  selectedMachineId: number | null;
  onSelect: (id: number) => void;
};

export function MachineGrid({ machines, selectedMachineId, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {machines.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={`rounded-2xl border p-4 text-left transition ${
            selectedMachineId === m.id
              ? "border-cobalt bg-cobalt/10"
              : "border-slate-200 bg-white hover:border-cobalt/50"
          }`}
        >
          <p className="text-sm text-slate-500">{m.zone}</p>
          <h4 className="mt-1 text-lg font-semibold text-slateink">{m.name}</h4>
          <p className="mt-2 text-sm text-slate-600">{m.current.is_on ? "ON" : "OFF"}</p>
          <p className="text-sm text-slate-600">{m.current.power_kw?.toFixed(2) ?? "0.00"} kW</p>
        </button>
      ))}
    </div>
  );
}
