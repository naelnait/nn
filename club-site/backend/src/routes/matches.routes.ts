import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import type { Match } from "../types/index.js";

export const matchesRouter = Router();

matchesRouter.get("/", cacheControl(60), async (req, res, next) => {
  try {
    const matches = await loadData<Match[]>("matches.json");
    const { status } = req.query;

    const sorted = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (status === "played" || status === "upcoming") {
      res.json(sorted.filter((m) => m.status === status));
      return;
    }

    res.json(sorted);
  } catch (err) {
    next(err);
  }
});

matchesRouter.get("/next", cacheControl(60), async (_req, res, next) => {
  try {
    const matches = await loadData<Match[]>("matches.json");
    const now = Date.now();
    const next5 = matches
      .filter((m) => m.status === "upcoming" && new Date(m.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(next5[0] ?? null);
  } catch (err) {
    next(err);
  }
});

matchesRouter.get("/latest", cacheControl(60), async (_req, res, next) => {
  try {
    const matches = await loadData<Match[]>("matches.json");
    const played = matches
      .filter((m) => m.status === "played")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(played[0] ?? null);
  } catch (err) {
    next(err);
  }
});
