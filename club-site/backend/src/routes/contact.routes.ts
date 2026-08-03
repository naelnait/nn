import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { getDb } from "../db/index.js";
import { insertContactMessage } from "../db/contactMessages.js";
import { ApiError } from "../middleware/errorHandler.js";

export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de messages envoyés, réessayez plus tard." },
});

// Upper bounds are defense-in-depth against oversized payloads, not just UX —
// express.json({ limit: "50kb" }) caps the whole body, but a single 49kb
// field is still wasteful to store/log.
const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
});

contactRouter.post("/", contactLimiter, (req, res, next) => {
  try {
    const parsed = ContactSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Merci de compléter correctement tous les champs du formulaire.");
    }

    // Persisted so the club can actually read submissions later. A real
    // deployment would also enqueue an email / CRM lead from here.
    insertContactMessage(getDb(), parsed.data);

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});
