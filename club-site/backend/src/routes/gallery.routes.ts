import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { GalleryAlbum } from "../types/index.js";

export const galleryRouter = Router();

galleryRouter.get("/", cacheControl(300), async (_req, res, next) => {
  try {
    const albums = await loadData<GalleryAlbum[]>("gallery.json");
    res.json([...albums].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (err) {
    next(err);
  }
});

galleryRouter.get("/:id", cacheControl(300), async (req, res, next) => {
  try {
    const albums = await loadData<GalleryAlbum[]>("gallery.json");
    const album = albums.find((a) => a.id === req.params.id);
    if (!album) throw new ApiError(404, "Album not found");
    res.json(album);
  } catch (err) {
    next(err);
  }
});
