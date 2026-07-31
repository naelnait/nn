import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { NewsItem } from "../types/index.js";

export const newsRouter = Router();

newsRouter.get("/", cacheControl(120), async (req, res, next) => {
  try {
    const news = await loadData<NewsItem[]>("news.json");
    const sorted = [...news].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(24, Math.max(1, Number(req.query.pageSize) || 6));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    res.json({
      items,
      page,
      pageSize,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

newsRouter.get("/:slug", cacheControl(300), async (req, res, next) => {
  try {
    const news = await loadData<NewsItem[]>("news.json");
    const item = news.find((n) => n.slug === req.params.slug || n.id === req.params.slug);
    if (!item) throw new ApiError(404, "Article not found");
    res.json(item);
  } catch (err) {
    next(err);
  }
});
