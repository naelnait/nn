import { Router } from "express";
import { loadData } from "../utils/loadData.js";
import { cacheControl } from "../middleware/cache.js";
import { ApiError } from "../middleware/errorHandler.js";
import type { Player } from "../types/index.js";

export const playersRouter = Router();

playersRouter.get("/", cacheControl(300), async (req, res, next) => {
  try {
    const players = await loadData<Player[]>("players.json");
    const { group } = req.query;

    // Squad first, then staff; jersey number orders the squad when known,
    // otherwise the club's own published order is preserved.
    const sorted = [...players].sort((a, b) => {
      if (Boolean(a.staff) !== Boolean(b.staff)) return a.staff ? 1 : -1;
      if (a.number != null && b.number != null) return a.number - b.number;
      return 0;
    });

    if (group === "squad") {
      res.json(sorted.filter((p) => !p.staff));
      return;
    }
    if (group === "staff") {
      res.json(sorted.filter((p) => p.staff));
      return;
    }

    res.json(sorted);
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
