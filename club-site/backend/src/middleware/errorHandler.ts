import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code ?? defaultCodeForStatus(status);
  }
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case 400: return "validation_error";
    case 404: return "not_found";
    case 429: return "rate_limited";
    default: return status >= 500 ? "internal_error" : "error";
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "not_found", message: "Not found" } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  // ApiError messages are ours and safe to show; anything else is an
  // unexpected internal failure, so only the server log gets the detail —
  // the client gets a generic message (no stack traces, no library internals).
  const code = err instanceof ApiError ? err.code : "internal_error";
  const message = err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez plus tard.";
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: { code, message } });
}
