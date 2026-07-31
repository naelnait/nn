const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? "Erreur inconnue");
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T, B>(path: string, body: B): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, data.error ?? "Erreur inconnue");
  }
  return res.json() as Promise<T>;
}
