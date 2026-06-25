/**
 * @file apps/backend/src/modules/progress/api/eventRoutes.js
 * @description Generic progress event endpoint — routes events to correct handler
 */

import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { createLogger } from "../../../shared/utils/logger.js";
import { progressService, streakService } from "../../../app/container.js";

const logger = createLogger("eventRoutes");

const router = express.Router();

/**
 * POST /api/progress/event
 * Generic progress event endpoint — routes events to correct handler.
 *
 * Body: { type: string, feature: string, data: object }
 *
 * Event types:
 *   - "record-answer"   → LearningService.recordQuizResult
 *   - "update-streak"   → StreakService.updateStreak
 *   - "batch-update"    → ProgressService.batchUpdateProgress
 */
router.post(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type, feature, data } = req.body;
    const userId = req.userId;

    switch (type) {
      case "record-answer":
        // Deprecated: old SRS word-level tracking removed in Epic 18 cleanup
        logger.debug(
          `[eventRoutes] record-answer skipped (deprecated): userId=${userId} wordId=${data.wordId}`,
        );
        break;
      case "update-streak":
        await streakService.updateStreak(userId, data.date ? new Date(data.date) : new Date());
        break;
      case "batch-update":
        await progressService.batchUpdateProgress(userId, data.updates);
        break;
      default:
        return res.status(400).json({ error: `Unknown event type: ${type}` });
    }

    res.status(200).json({ success: true });
  }),
);

export { router as eventRoutes };
