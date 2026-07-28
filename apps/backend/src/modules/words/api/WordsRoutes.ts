/**
 * @file apps/backend/src/modules/words/api/WordsRoutes.ts
 * @description Routes for word detail endpoints.
 *
 * Controller is injected via req.wordsController middleware.
 * PUBLIC data — no authentication required (guest users can look up words too).
 */

import express from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { optionalAuth } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// ── Rate Limiters ──────────────────────────────────────────────────────

/** GET rate limiter: 60 requests per minute per user */
const getLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req: Request) => req.userId || req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Guest GET rate limiter: 20 requests per minute per IP */
const guestGetLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req: Request) => req.ip || "unknown",
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Route-level middleware: apply stricter rate limit for guests */
function rateLimitByAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.userId) {
    getLimiter(req, res, next);
  } else {
    guestGetLimiter(req, res, next);
  }
}

/**
 * GET /v1/words/:glyph
 * Returns full word detail (pinyin, definitions, HSK level, constituent characters).
 * Optional authentication — guests can look up words.
 */
router.get(
  ROUTE_PATTERNS.wordsByGlyph(":glyph"),
  optionalAuth,
  rateLimitByAuth,
  asyncHandler((req: Request, res: Response) => req.wordsController!.getWordDetail(req, res)),
);

export default router;
