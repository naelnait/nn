import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import type { StandingRow } from "../types/index.js";

export const standingsRouter = Router();

standingsRouter.get("/", cacheControl(300), async (_req, res, next) => {
  try {
    const standings = await loadData<StandingRow[]>("standings.json");
    res.json([...standings].sort((a, b) => a.rank - b.rank));
  } catch (err) {
    next(err);
  }
});
