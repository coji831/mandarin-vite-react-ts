/**
 * @file gamificationRoutes.js
 * @description Routes for gamification endpoints (streaks, badges, freezes)
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { gamificationController } from "../../container.js";

const router = express.Router();

/**
 * GET /api/v1/gamification/badges
 * Fetch earned and available badges with progress tracking
 */
router.get(
  ROUTE_PATTERNS.gamificationBadges,
  authenticateToken,
  asyncHandler(gamificationController.getBadges),
);

export default router;
