import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { rowToNews } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";

export const newsRouter = Router();

const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(6),
});

newsRouter.get("/", cacheControl(120), (req, res, next) => {
  try {
    const parsed = PageQuerySchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, "Invalid pagination parameters");
    const { page, pageSize } = parsed.data;

    const db = getDb();
    const total = (db.prepare("SELECT COUNT(*) AS n FROM news").get() as { n: number }).n;
    const rows = db
      .prepare("SELECT * FROM news ORDER BY date DESC LIMIT ? OFFSET ?")
      .all(pageSize, (page - 1) * pageSize);

    res.json({
      items: (rows as Record<string, unknown>[]).map(rowToNews),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

newsRouter.get("/:slug", cacheControl(300), (req, res, next) => {
  try {
    const row = getDb()
      .prepare("SELECT * FROM news WHERE slug = ? OR id = ?")
      .get(req.params.slug, req.params.slug) as Record<string, unknown> | undefined;
    if (!row) throw new ApiError(404, "Article not found");
    res.json(rowToNews(row));
  } catch (err) {
    next(err);
  }
});
