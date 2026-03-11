type Props = {
  prompt: string;
  setPrompt: (value: string) => void;
  loading: boolean;
  answer: string;
  source: string;
  onAsk: () => void;
};

export function ChatAssistantPanel({ prompt, setPrompt, loading, answer, source, onAsk }: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-100">
      <h2 className="text-xl font-semibold text-slateink">AI Chat Assistant (Bonus)</h2>
      <div className="mt-3 flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-cobalt"
        />
        <button
          onClick={onAsk}
          disabled={loading}
          className="rounded-xl bg-cobalt px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>
      <div className="mt-3 rounded-xl bg-cloud p-3 text-sm text-slateink">{answer || "Ask about AI decisions or energy usage."}</div>
      {source ? <p className="mt-2 text-xs text-slate-500">source: {source}</p> : null}
    </section>
  );
}
