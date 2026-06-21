/**
 * @file apps/backend/src/modules/progression/api/progressionRoutes.js
 * @description Routes for progression endpoints (foundation progress, phase gates)
 * Stories: 18.1 (Foundations Page Structure)
 *
 * Controller injected via middleware in routes.js (req.progressionController).
 */

import express from "express";
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
  asyncHandler((req, res) => req.progressionController.getFoundationProgress(req, res)),
);

/**
 * GET /api/v1/progression/phase-gate
 * Fetch user's phase gate status (auto-creates if none exists)
 */
router.get(
  ROUTE_PATTERNS.progressionPhaseGate,
  authenticateToken,
  asyncHandler((req, res) => req.progressionController.getPhaseGate(req, res)),
);

/**
 * PUT /api/v1/progression/phase-gate
 * Update phase gate progression after a quiz attempt
 */
router.put(
  ROUTE_PATTERNS.progressionPhaseGate,
  authenticateToken,
  asyncHandler((req, res) => req.progressionController.updatePhaseGate(req, res)),
);

/**
 * PUT /api/v1/progression/foundation-progress/:sectionId
 * Mark a foundation section as completed
 */
router.put(
  ROUTE_PATTERNS.progressionFoundationProgressSection(":sectionId"),
  authenticateToken,
  asyncHandler((req, res) => req.progressionController.markSectionCompleted(req, res)),
);

export default router;
