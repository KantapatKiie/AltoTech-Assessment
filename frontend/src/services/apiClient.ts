const API_BASE =
  (import.meta as unknown as { env: { VITE_API_BASE?: string } }).env.VITE_API_BASE ||
  "http://localhost:8000/api";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error("Backend returned non-JSON response");
  }
  if (!response.ok) {
    const errorData = data as { detail?: string };
    throw new Error(errorData.detail || `Request failed: ${response.status}`);
  }
  return data;
}
