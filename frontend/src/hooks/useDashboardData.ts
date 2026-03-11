import { useEffect, useMemo, useState } from "react";
import type {
  AIDecision,
  Comparison,
  EnergyPoint,
  Machine,
  SensorPoint,
  Summary,
} from "../types/dashboard";
import {
  askAssistant,
  getComparison,
  getDailyEnergy,
  getDecisions,
  getMachinePowerSeries,
  getMachines,
  getSummary,
} from "../services/dashboardService";

function toDateInput(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useDashboardData() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyEnergy, setDailyEnergy] = useState<EnergyPoint[]>([]);
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    null,
  );
  const [machineSeries, setMachineSeries] = useState<SensorPoint[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateInput(new Date()),
  );
  const [chatPrompt, setChatPrompt] = useState("เมื่อวานพลังงานสูงเพราะอะไร");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatSource, setChatSource] = useState<string>("");
  const [chatMeta, setChatMeta] = useState<string>("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState("");

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === selectedMachineId) || null,
    [machines, selectedMachineId],
  );

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const now = new Date();
        const from = new Date(
          now.getTime() - 24 * 60 * 60 * 1000,
        ).toISOString();
        const to = now.toISOString();
        const beforeFrom = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const beforeTo = new Date(
          now.getTime() - 4 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const afterFrom = new Date(
          now.getTime() - 4 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const afterTo = now.toISOString();

        const [machineRes, summaryRes, dailyRes, decisionsRes, compareRes] =
          await Promise.all([
            getMachines(),
            getSummary(),
            getDailyEnergy(selectedDate),
            getDecisions(from, to),
            getComparison(beforeFrom, beforeTo, afterFrom, afterTo),
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

    load();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedMachineId) return;
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const to = now.toISOString();
    getMachinePowerSeries(selectedMachineId, from, to)
      .then((res) => setMachineSeries(res.points))
      .catch((e) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, [selectedMachineId]);

  const askAI = async () => {
    try {
      setLoadingChat(true);
      setChatAnswer("");
      setChatMeta("");
      const result = await askAssistant(chatPrompt);
      setChatAnswer(result.answer || "No answer");
      setChatSource(result.source || "");
      const parts = [result.llm_status ? `llm: ${result.llm_status}` : "", result.llm_error || ""].filter(Boolean);
      setChatMeta(parts.join(" | "));
    } catch (e) {
      setChatAnswer(e instanceof Error ? e.message : "Unknown error");
      setChatSource("error");
      setChatMeta("");
    } finally {
      setLoadingChat(false);
    }
  };

  return {
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
  };
}
