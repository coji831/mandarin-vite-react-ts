/**
 * @file apps/backend/src/modules/chengyu/api/ChengyuController.ts
 * @description Controller for chengyu idiom endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Coerces raw query strings, handles HTTP responses + error mapping only.
 * Semantic validation lives in ChengyuService (single source of truth,
 * unit-tested); the controller still fails fast on a malformed `:id` shape
 * so the internal uuid can never be treated as a content_id.
 *
 * Story 23.2 — Chengyu Backend API. Error responses follow
 * `backend-error-messages.instructions.md`:
 *   400 VALIDATION_ERROR / 404 NOT_FOUND / 500 INTERNAL_ERROR.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { ChengyuService } from "../services/ChengyuService.js";
import { ChengyuNotFoundError, ChengyuValidationError } from "../types/chengyu.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regular expression matching a chengyu business key (`cy_XXXX`). */
const CHENGYU_ID_REGEX = /^cy_\d+$/;

const logger = createLogger("ChengyuController");

/**
 * Controller for chengyu idiom operations.
 */
export class ChengyuController {
  private service: ChengyuService;

  constructor(service: ChengyuService) {
    this.service = service;
  }

  /**
   * GET /v1/chengyu/idioms
   * List idioms with optional `search` / `theme` / `era` filters and
   * `page` / `pageSize` pagination. All filters are optional and additive.
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const theme = req.query.theme !== undefined ? String(req.query.theme).trim() : undefined;
      const era = req.query.era !== undefined ? String(req.query.era).trim() : undefined;
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : undefined;

      const result = await this.service.listIdioms({ search, theme, era, page, pageSize });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ChengyuValidationError) {
        res.status(400).json({ error: err.message, code: err.code });
        return;
      }
      logger.error("Failed to load chengyu idioms", err);
      res.status(500).json({
        error: "Failed to load chengyu idioms",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/chengyu/idioms/:id
   * Get a single idiom by its `content_id` business key (`cy_XXXX`).
   * The internal uuid (or any non-`cy_XXXX` value) is rejected with a 400.
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      if (!id || !CHENGYU_ID_REGEX.test(id)) {
        res.status(400).json({
          error: "Failed to load chengyu idiom",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getIdiom(id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof ChengyuNotFoundError) {
        res.status(404).json({ error: err.message, code: err.code });
        return;
      }
      logger.error(`Failed to load chengyu idiom ${req.params.id}`, err);
      res.status(500).json({
        error: "Failed to load chengyu idiom",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
