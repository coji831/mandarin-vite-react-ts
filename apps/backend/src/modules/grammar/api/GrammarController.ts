/**
 * @file apps/backend/src/modules/grammar/api/GrammarController.ts
 * @description Controller for grammar pattern endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Coerces raw query strings, handles HTTP responses + error mapping only.
 * Semantic validation lives in GrammarService (single source of truth,
 * unit-tested); the controller still fails fast on a malformed `:id` shape
 * so the internal uuid can never be treated as a content_id.
 *
 * Story 22.2 — Grammar Backend API. Error responses follow
 * `backend-error-messages.instructions.md`:
 *   400 VALIDATION_ERROR / 404 NOT_FOUND / 500 INTERNAL_ERROR.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { GrammarService } from "../services/GrammarService.js";
import { GrammarNotFoundError, GrammarValidationError } from "../types/grammar.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression matching a grammar business key (`gr_XXXX`). */
const GRAMMAR_ID_REGEX = /^gr_\d+$/;

const logger = createLogger("GrammarController");

/**
 * Controller for grammar pattern operations.
 */
export class GrammarController {
  private service: GrammarService;

  constructor(service: GrammarService) {
    this.service = service;
  }

  /**
   * GET /v1/grammar/patterns
   * List patterns with optional `search` / `hskLevel` / `phase` filters and
   * `page` / `pageSize` pagination. All filters are optional and additive.
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const hskLevel = req.query.hskLevel !== undefined ? Number(req.query.hskLevel) : undefined;
      const phase = req.query.phase !== undefined ? Number(req.query.phase) : undefined;
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : undefined;

      const result = await this.service.listPatterns({ search, hskLevel, phase, page, pageSize });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof GrammarValidationError) {
        res.status(400).json({ error: err.message, code: err.code });
        return;
      }
      logger.error("Failed to load grammar patterns", err);
      res.status(500).json({
        error: "Failed to load grammar patterns",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/grammar/patterns/:id
   * Get a single pattern by its `content_id` business key (`gr_XXXX`).
   * The internal uuid (or any non-`gr_XXXX` value) is rejected with a 400.
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      if (!id || !GRAMMAR_ID_REGEX.test(id)) {
        res.status(400).json({
          error: "Failed to load grammar pattern",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getPattern(id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof GrammarNotFoundError) {
        res.status(404).json({ error: err.message, code: err.code });
        return;
      }
      logger.error(`Failed to load grammar pattern ${req.params.id}`, err);
      res.status(500).json({
        error: "Failed to load grammar pattern",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
