/**
 * @file apps/backend/src/modules/readers/api/readersRoutes.ts
 * @description Routes for reading passage CRUD and generation operations.
 *
 * Controller is injected via factory function (createReadersRoutes).
 * GET routes use optional auth (guests can browse passages); POST generate requires auth + daily rate limit.
 */

import express from "express";
import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { optionalAuth, requireAuth } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { ReadersController } from "./ReadersController.js";

/**
 * Create the readers router with controller injection.
 */
export function createReadersRoutes(readersController: ReadersController): express.Router {
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

  // ── Routes ─────────────────────────────────────────────────────────────

  /**
   * GET /v1/readers/passages
   * List cached passages, optionally filtered by HSK level.
   */
  router.get(
    ROUTE_PATTERNS.readersPassages,
    optionalAuth,
    rateLimitByAuth,
    asyncHandler((req: Request, res: Response) => readersController.listPassages(req, res)),
  );

  /**
   * GET /v1/readers/passages/:id
   * Full passage with segmented result and HSK profile.
   */
  router.get(
    ROUTE_PATTERNS.readersPassageById(":id"),
    optionalAuth,
    rateLimitByAuth,
    asyncHandler((req: Request, res: Response) => readersController.getPassage(req, res)),
  );

  /**
   * POST /v1/readers/passages/:id/audio
   * Get audio URLs for all sentences in a passage.
   * Two-tier fallback: GCS → on-demand TTS.
   * Uses POST because this endpoint may trigger TTS generation as a side-effect.
   */
  router.post(
    ROUTE_PATTERNS.readersPassageAudioById(":id"),
    requireAuth,
    asyncHandler((req: Request, res: Response) => readersController.getPassageAudio(req, res)),
  );

  /**
   * POST /v1/readers/generate
   * Generate passage. Auth-only. Body: { topic }.
   * Rate limited to 5/day per user (DB-backed UTC midnight reset).
   */
  router.post(
    ROUTE_PATTERNS.readersGenerate,
    requireAuth,
    asyncHandler((req: Request, res: Response) => readersController.generatePassage(req, res)),
  );

  return router;
}
