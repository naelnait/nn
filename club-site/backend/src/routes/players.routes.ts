import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { Player } from "../types/index.js";

export const playersRouter = Router();

playersRouter.get("/", cacheControl(300), async (_req, res, next) => {
  try {
    const players = await loadData<Player[]>("players.json");
    res.json(players.sort((a, b) => a.number - b.number));
  } catch (err) {
    next(err);
  }
});

playersRouter.get("/:id", cacheControl(300), async (req, res, next) => {
  try {
    const players = await loadData<Player[]>("players.json");
    const player = players.find((p) => p.id === req.params.id);
    if (!player) throw new ApiError(404, "Player not found");
    res.json(player);
  } catch (err) {
    next(err);
  }
});
