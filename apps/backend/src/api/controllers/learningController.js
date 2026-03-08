/**
 * @file apps/backend/src/api/controllers/LearningController.js
 * @description Learning controller handling HTTP requests for quiz-based learning endpoints
 * Story 15.11 Phase 8: Separated from QuizSessionController for clean architecture
 * Clean architecture: API layer - handles HTTP mapping only, delegates to service layer
 */

import { createLogger } from "../../utils/logger.js";

const logger = createLogger("LearningController");

/**
 * LearningController class with dependency injection
 * Story 15.11 Phase 8: Handles quiz-based learning endpoints (leeches only - due words and results moved to QuizSessionController)
 */
export class LearningController {
  /**
   * @param {object} learningService - LearningService instance
   */
  constructor(learningService) {
    this.learningService = learningService;
  }

  /**
   * Get user's struggling vocabulary (leeches)
   * GET /api/v1/learning/leeches?minLapseCount=5&limit=20
   */
  async getLeeches(req, res) {
    try {
      const userId = req.userId;
      const { minLapseCount, limit } = req.query;

      logger.info("Fetching leeches", { userId, minLapseCount, limit });

      // Parse minLapseCount parameter
      const minLapses = minLapseCount ? parseInt(minLapseCount, 10) : 5;
      if (isNaN(minLapses) || minLapses < 1) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_MIN_LAPSE_COUNT",
          message: "minLapseCount must be a positive number",
        });
      }

      // Parse limit parameter
      const maxCount = limit ? parseInt(limit, 10) : 20;
      if (isNaN(maxCount) || maxCount < 1 || maxCount > 100) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_LIMIT",
          message: "limit must be between 1 and 100",
        });
      }

      // Fetch leeches
      const leeches = await this.learningService.getLeechesByUser(userId, minLapses, maxCount);

      logger.info("Successfully fetched leeches", {
        userId,
        count: leeches.length,
      });

      res.status(200).json({ leeches });
    } catch (error) {
      logger.error("Error fetching leeches", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_LEECHES_FAILED",
        message: "Failed to fetch leeches",
      });
    }
  }
}

export default LearningController;
