/**
 * @file apps/backend/src/modules/characters/api/CharactersController.ts
 * @description Controller for character data endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Handles input validation and HTTP responses only.
 * Delegates business logic to CharactersService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { CharactersService } from "../services/CharactersService.js";
import {
  CharacterNotFoundError,
  PhoneticComponentNotFoundError,
  CharacterValidationError,
} from "../types/characters-errors.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regex for validating a single Chinese character glyph. */
const CHINESE_CHAR_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]$/;

const logger = createLogger("CharactersController");

/**
 * Controller for character detail endpoints.
 */
export class CharactersController {
  private service: CharactersService;

  constructor(service: CharactersService) {
    this.service = service;
  }

  /**
   * GET /v1/characters/:glyph
   * Returns full character detail (pinyin, meanings, stroke count, radical, etc.).
   */
  async getCharacter(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);

      if (!glyph || !CHINESE_CHAR_REGEX.test(glyph)) {
        res.status(400).json({
          error: "Invalid character glyph",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getCharacter(glyph);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        res.status(404).json({
          error: "Character not found",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to get character detail for ${req.params.glyph}`, err);
      res.status(500).json({
        error: "Failed to get character detail",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/phonetic
   * Returns phonetic component info (glyph, pinyin, meaning).
   */
  async getPhonetic(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);

      if (!glyph || !CHINESE_CHAR_REGEX.test(glyph)) {
        res.status(400).json({
          error: "Invalid character glyph",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getPhoneticComponent(glyph);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        res.status(404).json({
          error: "Character not found",
          code: "NOT_FOUND",
        });
        return;
      }
      if (err instanceof PhoneticComponentNotFoundError) {
        res.status(404).json({
          error: "No phonetic component found for this character",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to get phonetic component for ${req.params.glyph}`, err);
      res.status(500).json({
        error: "Failed to get phonetic component",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/homophones
   * Returns all characters sharing the same pronunciation, grouped by reading.
   * Optional query param: ?exactTone=true to filter by exact tone match.
   */
  async getHomophones(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);

      if (!glyph || !CHINESE_CHAR_REGEX.test(glyph)) {
        res.status(400).json({
          error: "Invalid character glyph",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const exactTone = req.query.exactTone === "true";
      const result = await this.service.getHomophones(glyph, exactTone);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        res.status(404).json({
          error: "Character not found",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to get homophones for ${req.params.glyph}`, err);
      res.status(500).json({
        error: "Failed to get homophones",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/decomposition
   * Returns the decomposition tree — constituent components with types.
   */
  async getDecomposition(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);

      if (!glyph || !CHINESE_CHAR_REGEX.test(glyph)) {
        res.status(400).json({
          error: "Invalid character glyph",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getDecomposition(glyph);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        res.status(404).json({
          error: "Character not found",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error(`Failed to get decomposition for ${req.params.glyph}`, err);
      res.status(500).json({
        error: "Failed to get decomposition",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/characters/search?q=&tone=&hskLevel=
   * Search characters by pinyin, tone filter, or HSK level.
   * Requires at least one filter parameter.
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const q = req.query.q as string | undefined;
      const tone = req.query.tone as string | undefined;
      const hskLevel = req.query.hskLevel as string | undefined;

      const result = await this.service.searchCharacters({ q, tone, hskLevel });
      res.status(200).json({ data: result });
    } catch (err) {
      if (err instanceof CharacterValidationError) {
        res.status(400).json({
          error: err.message,
          code: "VALIDATION_ERROR",
        });
        return;
      }
      logger.error("Failed to search characters", err);
      res.status(500).json({
        error: "Failed to search characters",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/characters/frequency?tier=&page=&pageSize=
   * Returns characters ordered by frequency rank, optionally filtered by HSK tier.
   */
  async getFrequency(req: Request, res: Response): Promise<void> {
    try {
      const tier = req.query.tier ? parseInt(req.query.tier as string, 10) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50;

      // Validate tier if provided
      if (tier !== undefined && (isNaN(tier) || tier < 1 || tier > 6)) {
        res.status(400).json({
          error: "Invalid tier parameter. Must be between 1 and 6.",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.service.getFrequencyList(tier, page, pageSize);
      res.status(200).json(result);
    } catch (err) {
      logger.error("Failed to get frequency list", err);
      res.status(500).json({
        error: "Failed to get frequency list",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
