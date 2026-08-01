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
import { optionalAuth, requireAuth } from "../../../shared/middleware/authMiddleware.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /api/v1/progression/foundation-progress
 * Fetch user's foundation section progress (auto-initializes if empty)
 * optionalAuth — guest users get empty array from controller
 */
router.get(
  ROUTE_PATTERNS.progressionFoundationProgress,
  optionalAuth,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.getFoundationProgress(req, res),
  ),
);

/**
 * PUT /api/v1/progression/foundation-progress/:sectionId
 * Mark a foundation section as completed.
 * requireAuth — progress requires a registered user.
 */
router.put(
  ROUTE_PATTERNS.progressionFoundationProgressSection(":sectionId"),
  requireAuth,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.markSectionCompleted(req, res),
  ),
);

/**
 * GET /api/v1/progression/phase-gate
 * Fetch user's phase gate status (auto-creates if none exists)
 * optionalAuth — guest users get all-unlocked response
 */
router.get(
  ROUTE_PATTERNS.progressionPhaseGate,
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.progressionController!.getPhaseGate(req, res)),
);

/**
 * GET /api/v1/progression/gates
 * Fetch COMPUTED gate statuses (Phase 2 IME, character count ≥500, Phase 3→4).
 * optionalAuth — guest users get all-passed (GUEST) response; authenticated
 * users get the computed per-user gate status from the controller.
 */
router.get(
  ROUTE_PATTERNS.progressionGates,
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.progressionController!.getGates(req, res)),
);

/**
 * PUT /api/v1/progression/phase-gate
 * Update phase gate progression after a quiz attempt
 * requireAuth — phase gating requires a registered user
 */
router.put(
  ROUTE_PATTERNS.progressionPhaseGate,
  requireAuth,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.updatePhaseGate(req, res),
  ),
);

// ── Radical Progress Routes ─────────────────────────────────────────────────

/**
 * GET /api/v1/progression/radical-progress
 * Fetch user's radical progress records
 * optionalAuth — guest users get empty array from controller
 */
router.get(
  ROUTE_PATTERNS.progressionRadicalProgress,
  optionalAuth,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.getRadicalProgress(req, res),
  ),
);

/**
 * PUT /api/v1/progression/radical-progress/:radicalId
 * Create or update radical progress (with ReviewItem side-effect when memorized=true)
 * requireAuth — progress persistence requires a registered user
 */
router.put(
  ROUTE_PATTERNS.progressionRadicalProgressById(":radicalId"),
  requireAuth,
  asyncHandler((req: Request, res: Response) =>
    req.progressionController!.upsertRadicalProgress(req, res),
  ),
);

export default router;
