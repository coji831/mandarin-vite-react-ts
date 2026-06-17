/**
 * @file apps/backend/src/modules/progression/api/ProgressionController.js
 * @description HTTP controller for progression endpoints (foundation progress, phase gates)
 * Story 18.1: Foundations Page Structure
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ProgressionController");

/**
 * ProgressionController
 * Handles HTTP requests for foundation progress tracking and phase gate access.
 * Keep business logic in service - controller only maps HTTP to service calls.
 */
export class ProgressionController {
  constructor(progressionService) {
    this.progressionService = progressionService;

    // Bind methods for use as Express route handlers
    this.getFoundationProgress = this.getFoundationProgress.bind(this);
    this.getPhaseGate = this.getPhaseGate.bind(this);
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
}
