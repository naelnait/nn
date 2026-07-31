import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { clubRouter } from "./routes/club.routes.js";
import { playersRouter } from "./routes/players.routes.js";
import { matchesRouter } from "./routes/matches.routes.js";
import { standingsRouter } from "./routes/standings.routes.js";
import { newsRouter } from "./routes/news.routes.js";
import { galleryRouter } from "./routes/gallery.routes.js";
import { partnersRouter } from "./routes/partners.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"];

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "50kb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/club", clubRouter);
  app.use("/api/players", playersRouter);
  app.use("/api/matches", matchesRouter);
  app.use("/api/standings", standingsRouter);
  app.use("/api/news", newsRouter);
  app.use("/api/gallery", galleryRouter);
  app.use("/api/partners", partnersRouter);
  app.use("/api/contact", contactRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
