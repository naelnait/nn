import type { NextFunction, Request, Response } from "express";

export function cacheControl(maxAgeSeconds: number) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAgeSeconds}, stale-while-revalidate=60`);
    next();
  };
}
