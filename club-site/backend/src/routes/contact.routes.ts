import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../middleware/errorHandler.js";
import type { ContactPayload } from "../types/index.js";

export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de messages envoyés, réessayez plus tard." },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isContactPayload(body: unknown): body is ContactPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.trim().length > 1 &&
    typeof b.email === "string" &&
    emailRegex.test(b.email) &&
    typeof b.subject === "string" &&
    b.subject.trim().length > 1 &&
    typeof b.message === "string" &&
    b.message.trim().length > 9
  );
}

contactRouter.post("/", contactLimiter, (req, res, next) => {
  try {
    if (!isContactPayload(req.body)) {
      throw new ApiError(400, "Merci de compléter correctement tous les champs du formulaire.");
    }

    // In a real deployment this would enqueue an email / CRM lead.
    console.log("New contact message:", {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});
