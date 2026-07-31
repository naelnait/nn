import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import type { Partner } from "../types/index.js";

const tierOrder: Record<Partner["tier"], number> = { gold: 0, silver: 1, bronze: 2 };

export const partnersRouter = Router();

partnersRouter.get("/", cacheControl(600), async (_req, res, next) => {
  try {
    const partners = await loadData<Partner[]>("partners.json");
    res.json([...partners].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]));
  } catch (err) {
    next(err);
  }
});
