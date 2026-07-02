/**
 * @file apps/backend/src/modules/progression/api/progressionRoutes.js
 * @description Routes for progression endpoints (foundation progress, phase gates)
 * Stories: 18.1 (Foundations Page Structure)
 *
 * Controller injected via middleware in routes.js (req.progressionController).
 */

import express from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /api/v1/progression/foundation-progress
 * Fetch user's foundation section progress (auto-initializes if empty)
 */
router.get(
  ROUTE_PATTERNS.progressionFoundationProgress,
  authenticateToken,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.getFoundationProgress(req, res),
  ),
);

/**
 * GET /api/v1/progression/phase-gate
 * Fetch user's phase gate status (auto-creates if none exists)
 */
router.get(
  ROUTE_PATTERNS.progressionPhaseGate,
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.progressionController!.getPhaseGate(req, res)),
);

/**
 * PUT /api/v1/progression/phase-gate
 * Update phase gate progression after a quiz attempt
 */
router.put(
  ROUTE_PATTERNS.progressionPhaseGate,
  authenticateToken,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.updatePhaseGate(req, res),
  ),
);

// ── Radical Progress Routes ─────────────────────────────────────────────────

/**
 * GET /api/v1/progression/radical-progress
 * Fetch user's radical progress records
 */
router.get(
  ROUTE_PATTERNS.progressionRadicalProgress,
  authenticateToken,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.getRadicalProgress(req, res),
  ),
);

/**
 * PUT /api/v1/progression/radical-progress/:radicalId
 * Create or update radical progress (with ReviewItem side-effect when memorized=true)
 */
router.put(
  ROUTE_PATTERNS.progressionRadicalProgressById(":radicalId"),
  authenticateToken,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.upsertRadicalProgress(req, res),
  ),
);

export default router;
