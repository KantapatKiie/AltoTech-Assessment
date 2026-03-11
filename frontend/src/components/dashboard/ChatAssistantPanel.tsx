import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import energyIcon from "../../assets/icons-energy.png";

type Props = {
  prompt: string;
  setPrompt: (value: string) => void;
  loading: boolean;
  answer: string;
  source: string;
  meta?: string;
  onAsk: () => void;
};

type ChatItem = {
  id: string;
  question: string;
  answer: string;
  source: string;
  meta?: string;
};

export function ChatAssistantPanel({
  prompt,
  setPrompt,
  loading,
  answer,
  source,
  meta,
  onAsk,
}: Props) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(
    () => prompt.trim().length > 0 && !loading,
    [prompt, loading],
  );

  useEffect(() => {
    if (!pendingQuestion || loading || !answer) return;
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        question: pendingQuestion,
        answer,
        source,
        meta,
      },
    ]);
    setPendingQuestion("");
  }, [answer, source, meta, loading, pendingQuestion]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [items, loading]);

  const handleAsk = () => {
    if (!canSend) return;
    setPendingQuestion(prompt.trim());
    onAsk();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if (event.shiftKey) return;
    event.preventDefault();
    handleAsk();
  };

  const handleClearHistory = () => {
    setItems([]);
    setPendingQuestion("");
    setPrompt("");
    inputRef.current?.focus();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-3 text-sm font-semibold text-white shadow-xl hover:brightness-105"
      >
        <img src={energyIcon} alt="Energy" className="h-5 w-5 rounded" />
        AI Chat
      </button>
    );
  }

  return (
    <section className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-slateink px-4 py-3 text-white">
        <div className="inline-flex items-center gap-2">
          <img
            src={energyIcon}
            alt="Energy Assistant"
            className="h-6 w-6 rounded"
          />
          <h2 className="text-sm font-semibold">AI Chat Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="rounded-md bg-slate-700/70 px-2 py-1 text-xs text-slate-100 hover:bg-slate-600"
          >
            Clear
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Hide
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-80 space-y-3 overflow-y-auto bg-cloud/70 p-3"
      >
        {items.length === 0 ? (
          <div className="rounded-xl bg-white p-3 text-xs text-slate-500">
            ถามเรื่องพลังงาน, สาเหตุโหลดสูง, หรือแนวทางประหยัดไฟได้เลย
          </div>
        ) : null}

        {items.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="ml-8 rounded-2xl rounded-br-md bg-cobalt px-3 py-2 text-sm text-white">
              {item.question}
            </div>
            <div className="mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              <p>{item.answer}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                source: {item.source || "unknown"}
              </p>
              {item.meta ? (
                <p className="mt-1 text-[11px] text-rose-600">{item.meta}</p>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="mr-8 rounded-2xl rounded-bl-md bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
            AI กำลังคิดคำตอบ...
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ถามอะไรเกี่ยวกับ HVAC วันนี้..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cobalt"
          />
          <button
            onClick={handleAsk}
            disabled={!canSend}
            className="rounded-xl bg-cobalt px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Enter ส่งข้อความ, Shift+Enter ขึ้นบรรทัดใหม่
        </p>
      </div>
    </section>
  );
}
