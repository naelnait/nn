import { Router } from "express";
import { getDb } from "../db/index.js";
import { rowToAlbum } from "../db/mappers.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";

export const galleryRouter = Router();

function photosByAlbum(albumIds: string[]): Map<string, string[]> {
  if (albumIds.length === 0) return new Map();
  const db = getDb();
  const placeholders = albumIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT album_id, photo FROM gallery_photos WHERE album_id IN (${placeholders}) ORDER BY album_id, position ASC`
    )
    .all(...albumIds) as { album_id: string; photo: string }[];
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (!map.has(r.album_id)) map.set(r.album_id, []);
    map.get(r.album_id)!.push(r.photo);
  }
  return map;
}

galleryRouter.get("/", cacheControl(300), (_req, res, next) => {
  try {
    const db = getDb();
    const albums = db.prepare("SELECT * FROM gallery_albums ORDER BY date DESC").all() as Record<
      string,
      unknown
    >[];
    const photos = photosByAlbum(albums.map((a) => a.id as string));
    res.json(albums.map((a) => rowToAlbum(a, photos.get(a.id as string) ?? [])));
  } catch (err) {
    next(err);
  }
});

galleryRouter.get("/:id", cacheControl(300), (req, res, next) => {
  try {
    const db = getDb();
    const album = db.prepare("SELECT * FROM gallery_albums WHERE id = ?").get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!album) throw new ApiError(404, "Album not found");
    const photos = db
      .prepare("SELECT photo FROM gallery_photos WHERE album_id = ? ORDER BY position ASC")
      .all(req.params.id) as { photo: string }[];
    res.json(rowToAlbum(album, photos.map((p) => p.photo)));
  } catch (err) {
    next(err);
  }
});
