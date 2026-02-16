/**
 * @file gamificationRoutes.js
 * @description Routes for gamification endpoints (streaks, badges, freezes)
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";
import { GamificationService } from "../../core/services/GamificationService.js";
import { BadgeRepository } from "../../infrastructure/repositories/BadgeRepository.js";
import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";
import { GamificationController } from "../controllers/GamificationController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize dependencies with proper injection
const badgeRepository = new BadgeRepository();
const streakRepository = new StreakRepository();

const gamificationService = new GamificationService(badgeRepository, streakRepository);
const gamificationController = new GamificationController(null, gamificationService);

// All gamification routes require authentication
// Note: Streak routes moved to progress.js to fix route ordering (Story 15.9)
// Only badge routes remain here as they use /v1/gamification namespace

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
