/**
 * @file gamificationRoutes.js
 * @description Routes for gamification endpoints (streaks, badges, freezes)
 * Story 15.3: Streak & Gamification Backend APIs
 */

import express from "express";
import { GamificationController } from "../controllers/GamificationController.js";
import { StreakService } from "../../core/services/StreakService.js";
import { GamificationService } from "../../core/services/GamificationService.js";
import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";
import { BadgeRepository } from "../../infrastructure/repositories/BadgeRepository.js";
import { QuizResultRepository } from "../../infrastructure/repositories/QuizResultRepository.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Initialize dependencies with proper injection
const streakRepository = new StreakRepository();
const badgeRepository = new BadgeRepository();
const quizResultRepository = new QuizResultRepository();

const streakService = new StreakService(streakRepository, quizResultRepository);
const gamificationService = new GamificationService(badgeRepository, streakRepository);

const gamificationController = new GamificationController(streakService, gamificationService);

// All gamification routes require authentication
// Note: These are relative paths - main app mounts them under /api

/**
 * GET /api/v1/progress/streak
 * Fetch user's streak data (currentStreak, longestStreak, freezeCount, lastActivityDate)
 */
router.get(
  "/v1/progress/streak",
  authenticateToken,
  asyncHandler(gamificationController.getStreak),
);

/**
 * POST /api/v1/progress/streak/freeze
 * Spend freeze to protect streak (extends grace period by 24h)
 * Requires: freezeCount >= 1, streak at risk (>48h since last activity)
 */
router.post(
  "/v1/progress/streak/freeze",
  authenticateToken,
  asyncHandler(gamificationController.spendFreeze),
);

/**
 * GET /api/v1/gamification/badges
 * Fetch earned and available badges with progress tracking
 */
router.get(
  "/v1/gamification/badges",
  authenticateToken,
  asyncHandler(gamificationController.getBadges),
);

export default router;
