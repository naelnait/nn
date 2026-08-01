const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function errorFromBody(body: unknown, fallback: string): { message: string; code: string } {
  const err = (body as { error?: unknown } | null)?.error;
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; code?: unknown };
    return { message: typeof e.message === "string" ? e.message : fallback, code: typeof e.code === "string" ? e.code : "error" };
  }
  return { message: typeof err === "string" ? err : fallback, code: "error" };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const { message, code } = errorFromBody(body, res.statusText || "Erreur inconnue");
    throw new ApiError(res.status, message, code);
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
    const data = await res.json().catch(() => null);
    const { message, code } = errorFromBody(data, res.statusText || "Erreur inconnue");
    throw new ApiError(res.status, message, code);
  }
  return res.json() as Promise<T>;
}
