/**
 * @file apps/backend/src/modules/progress/api/ProgressController.js
 * @description Progress tracking controller handling HTTP requests for progress endpoints
 * Clean architecture: API layer - handles HTTP mapping only, delegates to service layer
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ProgressController");

/**
 * ProgressController class with dependency injection
 */
export class ProgressController {
  /**
   * @param {object} progressService - ProgressService instance
   * @param {object} streakService - StreakService instance (Story 15.3)
   * @param {object} gamificationService - GamificationService instance (Story 15.3)
   */
  constructor(progressService, streakService = null, gamificationService = null) {
    this.progressService = progressService;
    this.streakService = streakService;
    this.gamificationService = gamificationService;
  }

  async getAllProgress(req, res) {
    try {
      const userId = req.userId;
      logger.info("Fetching all progress", { userId });

      const progress = await this.progressService.getProgressForUser(userId);
      logger.info("Successfully fetched progress", { userId, count: progress.length });

      res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching user progress", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_PROGRESS_FAILED",
        message: "Failed to fetch progress",
      });
    }
  }

  async getWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;

      if (!wordId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_WORD_ID",
          message: "Word ID is required",
        });
      }

      const progress = await this.progressService.getProgressForWord(userId, wordId);

      if (!progress) {
        return res.status(404).json({
          error: "Not Found",
          code: "PROGRESS_NOT_FOUND",
          message: "Progress not found for this word",
        });
      }

      res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_WORD_PROGRESS_FAILED",
        message: "Failed to fetch word progress",
      });
    }
  }

  async updateWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;
      const { studyCount, correctCount, confidence } = req.body;

      if (!wordId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_WORD_ID",
          message: "Word ID is required",
        });
      }

      if (studyCount !== undefined && (typeof studyCount !== "number" || studyCount < 0)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_STUDY_COUNT",
          message: "studyCount must be a non-negative number",
        });
      }

      if (correctCount !== undefined && (typeof correctCount !== "number" || correctCount < 0)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_CORRECT_COUNT",
          message: "correctCount must be a non-negative number",
        });
      }

      if (
        confidence !== undefined &&
        (typeof confidence !== "number" || confidence < 0 || confidence > 1)
      ) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_CONFIDENCE",
          message: "confidence must be a number between 0 and 1",
        });
      }

      const updated = await this.progressService.updateProgress(userId, wordId, {
        studyCount,
        correctCount,
        confidence,
      });

      res.status(200).json(updated);
    } catch (error) {
      logger.error("Error updating word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "UPDATE_PROGRESS_FAILED",
        message: "Failed to update progress",
      });
    }
  }

  async deleteWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;

      const deleted = await this.progressService.deleteProgress(userId, wordId);

      if (!deleted) {
        return res.status(404).json({
          error: "Not Found",
          code: "PROGRESS_NOT_FOUND",
          message: "Progress not found for this word",
        });
      }

      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "DELETE_PROGRESS_FAILED",
        message: "Failed to delete progress",
      });
    }
  }

  async getProgressStats(req, res) {
    try {
      const userId = req.userId;
      const stats = await this.progressService.getProgressStats(userId);
      res.status(200).json(stats);
    } catch (error) {
      logger.error("Error fetching progress stats", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_STATS_FAILED",
        message: "Failed to fetch progress stats",
      });
    }
  }

  async batchUpdateProgress(req, res) {
    try {
      const userId = req.userId;
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_UPDATES",
          message: "updates must be an array",
        });
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "Bad Request",
          code: "EMPTY_UPDATES",
          message: "updates array cannot be empty",
        });
      }

      for (const update of updates) {
        if (!update.wordId) {
          return res.status(400).json({
            error: "Bad Request",
            code: "MISSING_WORD_ID",
            message: "Each update must have a wordId",
          });
        }
      }

      const result = await this.progressService.batchUpdateProgress(userId, updates);
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error batch updating progress", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "BATCH_UPDATE_FAILED",
        message: "Failed to batch update progress",
      });
    }
  }
}

export default ProgressController;
