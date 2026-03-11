type Props = {
  points: Array<Record<string, unknown>>;
  valueKey: string;
};

export function LineChart({ points, valueKey }: Props) {
  const width = 900;
  const height = 220;

  if (points.length === 0) {
    return <div className="rounded-xl bg-cloud/70 p-6 text-slate-500">No data in selected range</div>;
  }

  const values = points.map((p) => Number(p[valueKey])).filter((v) => Number.isFinite(v));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const d = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * (width - 20) + 10;
      const y = height - ((Number(p[valueKey]) - min) / range) * (height - 20) - 10;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-xl bg-gradient-to-b from-cloud to-white">
      <path d={d} fill="none" stroke="#2669ff" strokeWidth="3" />
    </svg>
  );
}
