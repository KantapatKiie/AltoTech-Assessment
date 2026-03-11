type Props = {
  title: string;
  value: string;
  meta?: string;
  metaClassName?: string;
};

export function StatCard({ title, value, meta, metaClassName }: Props) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slateink">{value}</p>
      {meta ? <p className={`mt-2 text-xs ${metaClassName || "text-slate-500"}`}>{meta}</p> : null}
    </article>
  );
}
