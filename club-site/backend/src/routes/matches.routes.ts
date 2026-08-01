import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { rowToMatch } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";

export const matchesRouter = Router();

const StatusQuerySchema = z.object({ status: z.enum(["played", "upcoming"]).optional() });

matchesRouter.get("/", cacheControl(60), (req, res, next) => {
  try {
    const parsed = StatusQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid status filter");
    const { status } = parsed.data;

    const db = getDb();
    const rows = status
      ? db.prepare("SELECT * FROM matches WHERE status = ? ORDER BY date ASC").all(status)
      : db.prepare("SELECT * FROM matches ORDER BY date ASC").all();

    res.json((rows as Record<string, unknown>[]).map(rowToMatch));
  } catch (err) {
    next(err);
  }
});

matchesRouter.get("/next", cacheControl(60), (_req, res, next) => {
  try {
    const row = getDb()
      .prepare(
        `SELECT * FROM matches
         WHERE status = 'upcoming' AND datetime(date) >= datetime('now')
         ORDER BY date ASC LIMIT 1`
      )
      .get() as Record<string, unknown> | undefined;
    res.json(row ? rowToMatch(row) : null);
  } catch (err) {
    next(err);
  }
});

matchesRouter.get("/latest", cacheControl(60), (_req, res, next) => {
  try {
    const row = getDb()
      .prepare(`SELECT * FROM matches WHERE status = 'played' ORDER BY date DESC LIMIT 1`)
      .get() as Record<string, unknown> | undefined;
    res.json(row ? rowToMatch(row) : null);
  } catch (err) {
    next(err);
  }
});
