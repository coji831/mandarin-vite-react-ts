/**
 * @file apps/backend/src/modules/progression/api/ProgressionController.js
 * @description HTTP controller for progression endpoints (foundation progress, phase gates)
 * Stories: 18.1 (Foundations Page Structure)
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import { createGuestPhaseGate } from "@mandarin/shared-constants";

const logger = createLogger("ProgressionController");

/**
 * ProgressionController
 * Handles HTTP requests for foundation progress tracking and phase gate access.
 * Keep business logic in service - controller only maps HTTP to service calls.
 */
export class ProgressionController {
  private progressionService: import("../services/ProgressionService.js").ProgressionService;
  private reviewService: import("../../review/services/ReviewService.js").ReviewService;

  constructor(
    progressionService: import("../services/ProgressionService.js").ProgressionService,
    reviewService: import("../../review/services/ReviewService.js").ReviewService,
  ) {
    this.progressionService = progressionService;
    this.reviewService = reviewService;

    // Bind methods for use as Express route handlers
    this.getFoundationProgress = this.getFoundationProgress.bind(this);
    this.getPhaseGate = this.getPhaseGate.bind(this);
    this.getGates = this.getGates.bind(this);
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
   * @param req - Express request (expects req.userId from auth middleware)
   * @param res - Express response
   * @returns
   */
  async getFoundationProgress(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest user — no tracking data
        return res.status(200).json([]);
      }
      const progress = await this.progressionService.getOrCreateFoundationProgress(req.userId);

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching foundation progress", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch foundation progress", code: "LOAD_FAILED" });
    }
  }

  /**
   * GET /api/v1/progression/phase-gate
   * Fetch user's phase gate status.
   * Auto-creates with defaults if none exists.
   *
   * @param req - Express request (expects req.userId from auth middleware)
   * @param res - Express response
   * @returns
   */
  async getPhaseGate(req: Request, res: Response): Promise<Response> {
    if (!req.userId) {
      // Guest — return all content unlocked (no gating)
      return res.status(200).json(createGuestPhaseGate());
    }
    // Registered user: actual persisted phase gate from DB
    try {
      const phaseGate = await this.progressionService.getOrCreatePhaseGate(req.userId);
      return res.status(200).json(phaseGate);
    } catch (error) {
      logger.error("Error fetching phase gate", error);
      return res.status(500).json({ error: "Failed to fetch phase gate", code: "LOAD_FAILED" });
    }
  }

  /**
   * GET /api/v1/progression/gates
   * Fetch COMPUTED gate statuses for the user (Phase 2 IME, character count,
   * Phase 3→4 comprehension). Unlike the persisted phase-gate row, this
   * re-evaluates gates against current data so a character-count gate passed
   * outside the quiz flow is surfaced.
   *
   * @param req - Express request (expects req.userId from auth middleware)
   * @param res - Express response
   * @returns
   */
  async getGates(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest — no gating
        return res.status(200).json({
          phase2Gate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
          characterCountGate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
          phase3To4Gate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
        });
      }
      const gates = await this.progressionService.getGateStatus(req.userId);
      return res.status(200).json(gates);
    } catch (error) {
      logger.error("Error fetching gate status", error);
      return res.status(500).json({ error: "Failed to load gate status", code: "LOAD_FAILED" });
    }
  }

  /**
   * PUT /api/v1/progression/phase-gate
   * Update phase gate progression after a quiz attempt.
   * Protected by requireAuth middleware — guests never reach this handler.
   */
  async updatePhaseGate(req: Request, res: Response): Promise<Response> {
    try {
      const { phase, passed, gateCriteria } = req.body;
      const updated = await this.progressionService.updatePhaseGate(req.userId!, {
        phase,
        passed,
        gateCriteria,
      });
      return res.status(200).json(updated);
    } catch (error) {
      logger.error("Error updating phase gate", error);
      return res.status(500).json({ error: "Failed to update phase gate", code: "UPDATE_FAILED" });
    }
  }

  /**
   * PUT /api/v1/progression/foundation-progress/:sectionId
   * Mark a foundation section as completed.
   *
   * @param req - Express request (expects req.userId, req.params.sectionId)
   * @param res - Express response
   * @returns
   */
  async markSectionCompleted(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest user — no-op
        return res.status(200).json({ sectionId: req.params.sectionId, completed: false });
      }
      const sectionId = String(req.params.sectionId);
      const progress = await this.progressionService.upsertFoundationProgress(
        req.userId,
        sectionId,
        true,
      );
      return res.status(200).json(progress);
    } catch (error) {
      if (error instanceof Error && error.message?.startsWith("Invalid sectionId")) {
        return res.status(400).json({ error: error.message, code: "VALIDATION_ERROR" });
      }
      logger.error("Error marking section completed", error);
      return res
        .status(500)
        .json({ error: "Failed to mark section completed", code: "UPDATE_FAILED" });
    }
  }

  // ── Radical Progress ─────────────────────────────────────────────────────

  /**
   * GET /api/v1/progression/radical-progress
   * Fetch user's radical progress records.
   *
   * @param req - Express request (expects req.userId from auth middleware)
   * @param res - Express response
   * @returns
   */
  async getRadicalProgress(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest user — no tracking data
        return res.status(200).json([]);
      }
      const progress = await this.progressionService.getRadicalProgress(req.userId);

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching radical progress", error);
      return res
        .status(500)
        .json({ error: "Failed to load radical progress", code: "LOAD_FAILED" });
    }
  }

  /**
   * GET /api/v1/progression/radical-progress/:radicalId
   * Fetch progress for a specific radical.
   *
   * @param req - Express request (expects req.userId, req.params.radicalId)
   * @param res - Express response
   * @returns
   */
  async getRadicalProgressById(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest user — no tracking data
        return res.status(200).json(null);
      }
      const radicalId = String(req.params.radicalId);
      const progress = await this.progressionService.getRadicalProgressById(req.userId, radicalId);

      if (!progress) {
        return res
          .status(404)
          .json({ error: "Failed to load radical progress", code: "NOT_FOUND" });
      }

      return res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching radical progress by ID", error);
      return res
        .status(500)
        .json({ error: "Failed to load radical progress", code: "LOAD_FAILED" });
    }
  }

  /**
   * PUT /api/v1/progression/radical-progress/:radicalId
   * Create or update radical progress. If memorized=true, triggers ReviewItem side-effect
   * via ReviewService (cross-service orchestration at the controller level).
   *
   * @param req - Express request (expects req.userId, req.params.radicalId, req.body)
   * @param res - Express response
   * @returns
   */
  async upsertRadicalProgress(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        // Guest user — no-op
        return res.status(200).json({
          radicalId: req.params.radicalId,
          memorized: req.body.memorized ?? false,
          recognitionLevel: req.body.recognitionLevel ?? 0,
        });
      }
      const radicalId = String(req.params.radicalId);
      const { memorized, recognitionLevel } = req.body;

      const progress = await this.progressionService.upsertRadicalProgress(req.userId, radicalId, {
        memorized: memorized ?? false,
        recognitionLevel: recognitionLevel ?? 0,
      });

      // Side-effect: if memorized, create a ReviewItem via ReviewService (fire-and-forget)
      if (memorized && this.reviewService) {
        this.reviewService
          .recordRating(req.userId, {
            itemType: "radical",
            itemId: radicalId,
            rating: "good",
          })
          .catch((err: Error) => {
            logger.warn("Failed to create ReviewItem for radical", err);
          });
      }

      return res.status(200).json(progress);
    } catch (error) {
      if (error instanceof Error && error.message?.startsWith("Invalid radicalId")) {
        return res
          .status(400)
          .json({ error: "Failed to update radical progress", code: "VALIDATION_ERROR" });
      }
      logger.error("Error upserting radical progress", error);
      return res
        .status(500)
        .json({ error: "Failed to update radical progress", code: "UPDATE_FAILED" });
    }
  }
}
