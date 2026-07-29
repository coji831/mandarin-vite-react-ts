/**
 * @file apps/backend/src/modules/phonetic-clusters/api/PhoneticClustersController.ts
 * @description Controller for phonetic cluster endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Handles input validation and HTTP responses only.
 * Delegates business logic to PhoneticClustersService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { PhoneticClustersService } from "../services/PhoneticClustersService.js";
import { PhoneticClusterNotFoundError } from "../types/phonetic-clusters-errors.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression to match a numeric HSK level (1-6). */
const HSK_LEVEL_REGEX = /^[1-6]$/;

/** Regular expression to match a PhoneticCluster ID format (pc_NNNN). */
const PC_ID_REGEX = /^pc_\d+$/;

const logger = createLogger("PhoneticClustersController");

/**
 * Controller for phonetic cluster operations.
 */
export class PhoneticClustersController {
  private service: PhoneticClustersService;

  constructor(service: PhoneticClustersService) {
    this.service = service;
  }

  /**
   * GET /v1/phonetic-clusters
   * List all phonetic clusters, optionally filtered by HSK level.
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      let hskLevel: number | undefined;

      if (req.query.hskLevel !== undefined) {
        const parsed = Number(req.query.hskLevel);
        if (!HSK_LEVEL_REGEX.test(String(req.query.hskLevel))) {
          res.status(400).json({
            error: "Failed to load phonetic clusters",
            code: "VALIDATION_ERROR",
          });
          return;
        }
        hskLevel = parsed;
      }

      const result = await this.service.listClusters(hskLevel);
      res.json({ data: result });
    } catch (err) {
      logger.error("Failed to load phonetic clusters", err);
      res.status(500).json({
        error: "Failed to load phonetic clusters",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/phonetic-clusters/:id
   * Get a single phonetic cluster by ID.
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !PC_ID_REGEX.test(id)) {
        res.status(400).json({
          error: "Failed to load phonetic cluster",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getCluster(id);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof PhoneticClusterNotFoundError) {
        res.status(404).json({
          error: "Failed to load phonetic cluster",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to load phonetic cluster ${req.params.id}`, err);
      res.status(500).json({
        error: "Failed to load phonetic cluster",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
