/**
 * @file apps/backend/src/modules/characters/api/PinyinController.ts
 * @description Controller for pinyin search endpoints.
 *
 * Clean Architecture: Interface/API layer.
 * Handles HTTP request/response concerns, delegates to PinyinSearchService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { PinyinSearchService } from "../services/PinyinSearchService.js";
import { PinyinValidationError } from "../types/pinyin.js";

const logger = createLogger("PinyinController");

export class PinyinController {
  private service: PinyinSearchService;

  constructor(service: PinyinSearchService) {
    this.service = service;
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const tone = req.query.tone ? parseInt(req.query.tone as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;

      // Validate q is provided
      if (!q || q.trim().length === 0) {
        res.status(400).json({
          error: "Query parameter 'q' is required",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      // Validate tone if provided
      if (tone !== undefined && (isNaN(tone) || tone < 1 || tone > 5)) {
        res.status(400).json({
          error: "Invalid tone parameter. Must be between 1 and 5.",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.search({ q, tone, page, pageSize });
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof PinyinValidationError) {
        res.status(400).json({ error: err.message, code: "VALIDATION_ERROR" });
        return;
      }
      logger.error("Failed to search pinyin", err);
      res.status(500).json({ error: "Failed to search pinyin", code: "INTERNAL_ERROR" });
    }
  }
}
