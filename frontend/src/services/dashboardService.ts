import { apiGet, apiPost } from "./apiClient";
import type { AIDecision, ChatResponse, Comparison, EnergyPoint, Machine, SensorPoint, Summary } from "../types/dashboard";

export function getMachines() {
  return apiGet<{ items: Machine[] }>("/machines");
}

export function getSummary() {
  return apiGet<Summary>("/building/summary");
}

export function getDailyEnergy(date: string) {
  return apiGet<{ points: EnergyPoint[] }>(`/energy/daily?date=${date}&bucket=hour`);
}

export function getDecisions(from: string, to: string) {
  return apiGet<{ items: AIDecision[] }>(`/ai-decisions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export function getComparison(beforeFrom: string, beforeTo: string, afterFrom: string, afterTo: string) {
  return apiGet<Comparison>(
    `/energy/comparison?before_from=${encodeURIComponent(beforeFrom)}&before_to=${encodeURIComponent(
      beforeTo
    )}&after_from=${encodeURIComponent(afterFrom)}&after_to=${encodeURIComponent(afterTo)}`
  );
}

export function getMachinePowerSeries(machineId: number, from: string, to: string) {
  return apiGet<{ points: SensorPoint[] }>(
    `/machines/${machineId}/sensor-data?metric=power_kw&bucket=hour&from=${encodeURIComponent(
      from
    )}&to=${encodeURIComponent(to)}`
  );
}

export function askAssistant(prompt: string) {
  return apiPost<ChatResponse>("/ai/chat", { prompt });
}
