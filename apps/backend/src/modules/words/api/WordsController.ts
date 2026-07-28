/**
 * @file apps/backend/src/modules/words/api/WordsController.ts
 * @description Controller for word detail endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Handles input validation and HTTP responses only.
 * Delegates business logic to WordsService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { WordsService } from "../services/WordsService.js";
import { WordNotFoundError } from "../types/words-errors.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regex for validating a Chinese glyph (one or more CJK Unified Ideographs). */
const CHINESE_GLYPH_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]+$/;

const logger = createLogger("WordsController");

/**
 * Controller for word detail operations.
 */
export class WordsController {
  private wordsService: WordsService;

  constructor(wordsService: WordsService) {
    this.wordsService = wordsService;
  }

  /**
   * GET /v1/words/:glyph
   * Fetch full word detail including pinyin, definitions, HSK level,
   * and constituent characters.
   */
  async getWordDetail(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);

      // Validate glyph contains only Chinese characters
      if (!glyph || !CHINESE_GLYPH_REGEX.test(glyph)) {
        res.status(400).json({
          error: "Failed to load word detail",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.wordsService.getWordDetail(glyph);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof WordNotFoundError) {
        res.status(404).json({
          error: "Failed to load word detail",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to load word detail for ${req.params.glyph}`, err);
      res.status(500).json({
        error: "Failed to load word detail",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
