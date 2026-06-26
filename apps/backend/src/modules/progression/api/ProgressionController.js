/**
 * @file apps/backend/src/modules/progression/api/ProgressionController.js
 * @description HTTP controller for progression endpoints (foundation progress, phase gates)
 * Stories: 18.1 (Foundations Page Structure)
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ProgressionController");

/**
 * ProgressionController
 * Handles HTTP requests for foundation progress tracking and phase gate access.
 * Keep business logic in service - controller only maps HTTP to service calls.
 */
export class ProgressionController {
  constructor(progressionService, reviewService) {
    this.progressionService = progressionService;
    this.reviewService = reviewService;

    // Bind methods for use as Express route handlers
    this.getFoundationProgress = this.getFoundationProgress.bind(this);
    this.getPhaseGate = this.getPhaseGate.bind(this);
    this.updatePhaseGate = this.updatePhaseGate.bind(this);
    this.markSectionCompleted = this.markSectionCompleted.bind(this);
    this.getRadicalProgress = this.getRadicalProgress.bind(this);
    this.getRadicalProgressById = this.getRadicalProgressById.bind(this);
    this.upsertRadicalProgress = this.upsertRadicalProgress.bind(this);
  }

  /**
   * GET /api/v1/progression/foundation-progress
   * Fetch user's foundation section progress.
   * Auto-initializes 4 records (one per FOUNDATION_SECTIONS) if none exist.
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getFoundationProgress(req, res) {
    try {
      const userId = req.userId;
      const progress = await this.progressionService.getOrCreateFoundationProgress(userId);

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching foundation progress", error);
      return res.status(500).json({ error: "Failed to fetch foundation progress" });
    }
  }

  /**
   * GET /api/v1/progression/phase-gate
   * Fetch user's phase gate status.
   * Auto-creates with defaults if none exists.
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getPhaseGate(req, res) {
    try {
      const userId = req.userId;
      const phaseGate = await this.progressionService.getOrCreatePhaseGate(userId);

      return res.status(200).json(phaseGate);
    } catch (error) {
      logger.error("Error fetching phase gate", error);
      return res.status(500).json({ error: "Failed to fetch phase gate" });
    }
  }
  /**
   * PUT /api/v1/progression/phase-gate
   * Update phase gate progression after a quiz attempt.
   *
   * @param {object} req - Express request (expects req.userId + body with phase, passed, gateCriteria)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async updatePhaseGate(req, res) {
    try {
      const userId = req.userId;
      const gate = await this.progressionService.updatePhaseGate(userId, req.body);
      return res.status(200).json(gate);
    } catch (error) {
      logger.error("Error updating phase gate", error);
      return res.status(500).json({ error: "Failed to update phase gate" });
    }
  }

  /**
   * PUT /api/v1/progression/foundation-progress/:sectionId
   * Mark a foundation section as completed.
   *
   * @param {object} req - Express request (expects req.userId, req.params.sectionId)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async markSectionCompleted(req, res) {
    try {
      const userId = req.userId;
      const { sectionId } = req.params;
      const progress = await this.progressionService.upsertFoundationProgress(
        userId,
        sectionId,
        true,
      );
      return res.status(200).json(progress);
    } catch (error) {
      if (error.message?.startsWith("Invalid sectionId")) {
        return res.status(400).json({ error: error.message });
      }
      logger.error("Error marking section completed", error);
      return res.status(500).json({ error: "Failed to mark section completed" });
    }
  }

  // ── Radical Progress ─────────────────────────────────────────────────────

  /**
   * GET /api/v1/progression/radical-progress
   * Fetch user's radical progress records.
   *
   * @param {object} req - Express request (expects req.userId from auth middleware)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getRadicalProgress(req, res) {
    try {
      const userId = req.userId;
      const progress = await this.progressionService.getRadicalProgress(userId);

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching radical progress", error);
      return res.status(500).json({ error: "Failed to load radical progress", code: "LOAD_ERROR" });
    }
  }

  /**
   * GET /api/v1/progression/radical-progress/:radicalId
   * Fetch progress for a specific radical.
   *
   * @param {object} req - Express request (expects req.userId, req.params.radicalId)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async getRadicalProgressById(req, res) {
    try {
      const userId = req.userId;
      const { radicalId } = req.params;
      const progress = await this.progressionService.getRadicalProgressById(userId, radicalId);

      if (!progress) {
        return res
          .status(404)
          .json({ error: "Failed to load radical progress", code: "NOT_FOUND" });
      }

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching radical progress by ID", error);
      return res.status(500).json({ error: "Failed to load radical progress", code: "LOAD_ERROR" });
    }
  }

  /**
   * PUT /api/v1/progression/radical-progress/:radicalId
   * Create or update radical progress. If memorized=true, triggers ReviewItem side-effect
   * via ReviewService (cross-service orchestration at the controller level).
   *
   * @param {object} req - Express request (expects req.userId, req.params.radicalId, req.body)
   * @param {object} res - Express response
   * @returns {Promise<void>}
   */
  async upsertRadicalProgress(req, res) {
    try {
      const userId = req.userId;
      const { radicalId } = req.params;
      const { memorized, recognitionLevel } = req.body;

      const progress = await this.progressionService.upsertRadicalProgress(userId, radicalId, {
        memorized: memorized ?? false,
        recognitionLevel: recognitionLevel ?? 0,
      });

      // Side-effect: if memorized, create a ReviewItem via ReviewService (fire-and-forget)
      if (memorized && this.reviewService) {
        this.reviewService
          .recordRating(userId, {
            itemType: "radical",
            itemId: radicalId,
            rating: "good",
          })
          .catch((err) => {
            logger.warn("Failed to create ReviewItem for radical", err);
          });
      }

      return res.status(200).json(progress);
    } catch (error) {
      if (error.message?.startsWith("Invalid radicalId")) {
        return res
          .status(400)
          .json({ error: "Failed to update radical progress", code: "VALIDATION_ERROR" });
      }
      logger.error("Error upserting radical progress", error);
      return res
        .status(500)
        .json({ error: "Failed to update radical progress", code: "INTERNAL_ERROR" });
    }
  }
}
