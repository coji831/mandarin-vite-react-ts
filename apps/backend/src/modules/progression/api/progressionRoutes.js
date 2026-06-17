/**
 * @file apps/backend/src/modules/progression/api/progressionRoutes.js
 * @description Routes for progression endpoints (foundation progress, phase gates)
 * Story 18.1: Foundations Page Structure
 */

import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { progressionController } from "../../../app/container.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /api/v1/progression/foundation-progress
 * Fetch user's foundation section progress (auto-initializes if empty)
 */
router.get(
  ROUTE_PATTERNS.progressionFoundationProgress,
  authenticateToken,
  asyncHandler(progressionController.getFoundationProgress),
);

/**
 * GET /api/v1/progression/phase-gate
 * Fetch user's phase gate status (auto-creates if none exists)
 */
router.get(
  ROUTE_PATTERNS.progressionPhaseGate,
  authenticateToken,
  asyncHandler(progressionController.getPhaseGate),
);

export default router;
