import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { rowToPlayer } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";

export const playersRouter = Router();

const GroupQuerySchema = z.object({ group: z.enum(["squad", "staff"]).optional() });

// Numbered players first (ordered by jersey number), then unnumbered ones in
// the club's own published order — sort_order is the array index from the
// source JSON, set at seed time.
const ORDER_BY = "ORDER BY staff ASC, (number IS NULL) ASC, number ASC, sort_order ASC";

playersRouter.get("/", cacheControl(300), (req, res, next) => {
  try {
    const parsed = GroupQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid group filter");
    const { group } = parsed.data;

    const db = getDb();
    const rows =
      group === "squad"
        ? db.prepare(`SELECT * FROM players WHERE staff = 0 ${ORDER_BY}`).all()
        : group === "staff"
          ? db.prepare(`SELECT * FROM players WHERE staff = 1 ${ORDER_BY}`).all()
          : db.prepare(`SELECT * FROM players ${ORDER_BY}`).all();

    res.json((rows as Record<string, unknown>[]).map(rowToPlayer));
  } catch (err) {
    next(err);
  }
});

playersRouter.get("/:id", cacheControl(300), (req, res, next) => {
  try {
    const row = getDb().prepare("SELECT * FROM players WHERE id = ?").get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!row) throw new ApiError(404, "Player not found");
    res.json(rowToPlayer(row));
  } catch (err) {
    next(err);
  }
});
