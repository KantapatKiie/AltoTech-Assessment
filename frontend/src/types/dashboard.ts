export type Machine = {
  id: number;
  name: string;
  machine_type: string;
  zone: string;
  rated_power_kw: number;
  current: {
    power_kw: number | null;
    temperature_c: number | null;
    setpoint_c: number | null;
    speed_percent: number | null;
    is_on: boolean | null;
    timestamp: string | null;
  };
};

export type Summary = {
  total_power_kw: number;
  active_machines: number;
  average_temperature_c: number | null;
  today_energy_kwh: number;
  yesterday_energy_kwh: number;
  is_trending_higher_than_yesterday: boolean;
};

export type EnergyPoint = {
  timestamp: string;
  energy_kwh: number;
};

export type SensorPoint = {
  timestamp: string;
  value: number;
};

export type AIDecision = {
  id: number;
  timestamp: string;
  action_type: string;
  action_value: string;
  reason: string;
  machine: {
    id: number;
    name: string;
  };
};

export type Comparison = {
  before_kwh: number;
  after_kwh: number;
  delta_kwh: number;
  savings_percent: number;
};

export type ChatResponse = {
  answer?: string;
  detail?: string;
  source?: "anthropic" | "fallback";
  llm_status?: "connected" | "unavailable";
  llm_error?: string;
};
