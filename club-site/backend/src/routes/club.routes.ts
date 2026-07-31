import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import type { Club } from "../types/index.js";

export const clubRouter = Router();

clubRouter.get("/", cacheControl(300), async (_req, res, next) => {
  try {
    const club = await loadData<Club>("club.json");
    res.json(club);
  } catch (err) {
    next(err);
  }
});
