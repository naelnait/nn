import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
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

    // In a real deployment this would enqueue an email / CRM lead.
    console.log("New contact message:", {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});
