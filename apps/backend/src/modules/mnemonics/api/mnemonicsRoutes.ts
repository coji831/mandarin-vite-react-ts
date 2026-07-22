/**
 * @file apps/backend/src/modules/mnemonics/api/mnemonicsRoutes.ts
 * @description Routes for mnemonic story CRUD operations.
 *
 * Controller is injected via req.mnemonicsController middleware.
 * All routes require authentication.
 */

import express from "express";
import type { Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { requireAuth } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// ── Rate Limiters ──────────────────────────────────────────────────────────

/** GET rate limiter: 60 requests per minute per user */
const getLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req: Request) => req.userId || ipKeyGenerator(req.ip || "unknown"),
  message: {
    error: "Too many requests. Please wait a moment before fetching more mnemonics.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** POST (generate) rate limiter: 10 requests per minute per user */
const generateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req: Request) => req.userId || ipKeyGenerator(req.ip || "unknown"),
  message: {
    error: "Too many generation requests. Please wait a moment before generating more mnemonics.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** PUT (update) rate limiter: 30 requests per minute per user */
const updateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req: Request) => req.userId || ipKeyGenerator(req.ip || "unknown"),
  message: {
    error: "Too many update requests. Please wait a moment before updating more mnemonics.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** DELETE (reset) rate limiter: 30 requests per minute per user */
const deleteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req: Request) => req.userId || ipKeyGenerator(req.ip || "unknown"),
  message: {
    error: "Too many reset requests. Please wait a moment before resetting more mnemonics.",
    code: "RATE_LIMIT",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /v1/mnemonics/:character
 * Fetch a mnemonic story for a character.
 * Uses 4-step lookup chain: user-edited → cache → DB(AI) → generate.
 */
router.get(
  ROUTE_PATTERNS.mnemonicsByChar(":character"),
  requireAuth,
  getLimiter,
  asyncHandler((req: Request, res: Response) => req.mnemonicsController!.getMnemonic(req, res)),
);

/**
 * POST /v1/mnemonics/:character
 * Generate a new mnemonic story for a character via AI.
 */
router.post(
  ROUTE_PATTERNS.mnemonicsByChar(":character"),
  requireAuth,
  generateLimiter,
  asyncHandler((req: Request, res: Response) =>
    req.mnemonicsController!.generateMnemonic(req, res),
  ),
);

/**
 * PUT /v1/mnemonics/:character
 * Update (edit) a user's mnemonic story.
 */
router.put(
  ROUTE_PATTERNS.mnemonicsByChar(":character"),
  requireAuth,
  updateLimiter,
  asyncHandler((req: Request, res: Response) => req.mnemonicsController!.updateMnemonic(req, res)),
);

/**
 * DELETE /v1/mnemonics/:character
 * Reset a user's mnemonic story (delete the user-edited version).
 */
router.delete(
  ROUTE_PATTERNS.mnemonicsByChar(":character"),
  requireAuth,
  deleteLimiter,
  asyncHandler((req: Request, res: Response) => req.mnemonicsController!.resetMnemonic(req, res)),
);

export default router;
