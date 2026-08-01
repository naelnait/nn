import { Router } from "express";
import { getDb } from "../db/index.js";
import { rowToPartner } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";

export const partnersRouter = Router();

partnersRouter.get("/", cacheControl(600), (_req, res, next) => {
  try {
    const rows = getDb()
      .prepare(
        `SELECT * FROM partners
         ORDER BY CASE tier WHEN 'institutionnel' THEN 0 WHEN 'majeur' THEN 1 ELSE 2 END`
      )
      .all();
    res.json((rows as Record<string, unknown>[]).map(rowToPartner));
  } catch (err) {
    next(err);
  }
});
