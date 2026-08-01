import { Router } from "express";
import { getDb } from "../db/index.js";
import { rowToClub } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";

export const clubRouter = Router();

clubRouter.get("/", cacheControl(300), (_req, res, next) => {
  try {
    const row = getDb().prepare("SELECT * FROM club WHERE id = 1").get() as Record<string, unknown>;
    res.json(rowToClub(row));
  } catch (err) {
    next(err);
  }
});
