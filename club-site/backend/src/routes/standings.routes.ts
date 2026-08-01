import { Router } from "express";
import { getDb } from "../db/index.js";
import { rowToStanding } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";

export const standingsRouter = Router();

standingsRouter.get("/", cacheControl(300), (_req, res, next) => {
  try {
    const rows = getDb().prepare("SELECT * FROM standings ORDER BY rank ASC").all();
    res.json((rows as Record<string, unknown>[]).map(rowToStanding));
  } catch (err) {
    next(err);
  }
});
