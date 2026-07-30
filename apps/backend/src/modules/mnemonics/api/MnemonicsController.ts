/**
 * @file apps/backend/src/modules/mnemonics/api/MnemonicsController.ts
 * @description Controller for mnemonic story endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Handles input validation and HTTP responses only.
 * Delegates business logic to MnemonicsService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { MnemonicsService } from "../services/MnemonicsService.js";
import { MnemonicNotFoundError } from "../types/mnemonics.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Han character regex — matches a single CJK Unified Ideograph (U+4E00–U+9FFF). */
const HAN_CHAR_REGEX = /^[\u4e00-\u9fff]$/;

/** Maximum story length for user-submitted stories. */
const MAX_STORY_LENGTH = 1000;

const logger = createLogger("MnemonicsController");

/**
 * Controller for mnemonic story CRUD operations.
 */
export class MnemonicsController {
  private mnemonicsService: MnemonicsService;

  constructor(mnemonicsService: MnemonicsService) {
    this.mnemonicsService = mnemonicsService;
  }

  /**
   * GET /v1/mnemonics/:character
   * Fetch a mnemonic story for a character.
   * Uses the 4-step lookup chain (user-edited → cache → DB(AI) → generate).
   */
  async getMnemonic(req: Request, res: Response): Promise<void> {
    try {
      const character = String(req.params.character);
      const userId = req.userId;

      // Validate character is a single Han character
      const validationError = validateCharacter(character);
      if (validationError) {
        res.status(400).json({
          error: "Failed to fetch mnemonic story",
          code: "VALIDATION_ERROR",
          message: validationError,
        });
        return;
      }

      const result = await this.mnemonicsService.getMnemonic(character, userId);
      res.json(result);
    } catch (err) {
      if (err instanceof MnemonicNotFoundError) {
        res.status(404).json({
          error: "Failed to fetch mnemonic story",
          code: "NOT_FOUND",
          message: err.message,
        });
        return;
      }
      logger.error("Failed to fetch mnemonic story", err);
      res.status(500).json({
        error: "Failed to fetch mnemonic story",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * POST /v1/mnemonics/:character
   * Generate a new mnemonic story for a character via AI.
   */
  async generateMnemonic(req: Request, res: Response): Promise<void> {
    try {
      const character = String(req.params.character);
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: "Failed to generate mnemonic story",
          code: "AUTH_ERROR",
          message: "Authentication required",
        });
        return;
      }

      // Validate character
      const validationError = validateCharacter(character);
      if (validationError) {
        res.status(400).json({
          error: "Failed to generate mnemonic story",
          code: "VALIDATION_ERROR",
          message: validationError,
        });
        return;
      }

      const result = await this.mnemonicsService.generateMnemonic(character, userId);
      res.status(201).json(result);
    } catch (err) {
      // Differentiate between AI errors (503) and unexpected errors (500)
      if (
        err instanceof Error &&
        (err.message.includes("AI") ||
          err.message.includes("timeout") ||
          err.message.includes("Gemini"))
      ) {
        logger.warn("AI generation service error", err);
        res.status(503).json({
          error: "Failed to generate mnemonic story",
          code: "SERVICE_UNAVAILABLE",
          message: "AI generation service is temporarily unavailable. Please try again later.",
        });
      } else {
        logger.error("Failed to generate mnemonic story", err);
        res.status(500).json({
          error: "Failed to generate mnemonic story",
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        });
      }
    }
  }

  /**
   * PUT /v1/mnemonics/:character
   * Update (edit) a user's mnemonic story.
   */
  async updateMnemonic(req: Request, res: Response): Promise<void> {
    try {
      const character = String(req.params.character);
      const userId = req.userId;
      const { story, radicalIds } = req.body as { story?: string; radicalIds?: string[] };

      if (!userId) {
        res.status(401).json({
          error: "Failed to update mnemonic story",
          code: "AUTH_ERROR",
          message: "Authentication required",
        });
        return;
      }

      // Validate character
      const charValidationError = validateCharacter(character);
      if (charValidationError) {
        res.status(400).json({
          error: "Failed to update mnemonic story",
          code: "VALIDATION_ERROR",
          message: charValidationError,
        });
        return;
      }

      // Validate story
      if (!story || typeof story !== "string" || story.trim().length === 0) {
        res.status(400).json({
          error: "Failed to update mnemonic story",
          code: "VALIDATION_ERROR",
          message: "Story is required and must be a non-empty string",
        });
        return;
      }

      if (story.length > MAX_STORY_LENGTH) {
        res.status(400).json({
          error: "Failed to update mnemonic story",
          code: "VALIDATION_ERROR",
          message: `Story must be ${MAX_STORY_LENGTH} characters or fewer`,
        });
        return;
      }

      // Validate radicalIds if provided
      if (radicalIds !== undefined) {
        if (!Array.isArray(radicalIds) || !radicalIds.every((id) => typeof id === "string")) {
          res.status(400).json({
            error: "Failed to update mnemonic story",
            code: "VALIDATION_ERROR",
            message: "radicalIds must be an array of strings",
          });
          return;
        }
      }

      // Sanitize HTML tags from user-submitted story
      const sanitizedStory = story.replace(/<[^>]*>/g, "").trim();

      const result = await this.mnemonicsService.updateMnemonic(
        character,
        userId,
        sanitizedStory,
        radicalIds,
      );
      res.json(result);
    } catch (err) {
      logger.error("Failed to update mnemonic story", err);
      res.status(500).json({
        error: "Failed to update mnemonic story",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * DELETE /v1/mnemonics/:character
   * Reset a user's mnemonic story (delete the user-edited version).
   */
  async resetMnemonic(req: Request, res: Response): Promise<void> {
    try {
      const character = String(req.params.character);
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: "Failed to reset mnemonic story",
          code: "AUTH_ERROR",
          message: "Authentication required",
        });
        return;
      }

      // Validate character
      const validationError = validateCharacter(character);
      if (validationError) {
        res.status(400).json({
          error: "Failed to reset mnemonic story",
          code: "VALIDATION_ERROR",
          message: validationError,
        });
        return;
      }

      await this.mnemonicsService.resetMnemonic(character, userId);
      res.status(204).send();
    } catch (err) {
      logger.error("Failed to reset mnemonic story", err);
      res.status(500).json({
        error: "Failed to reset mnemonic story",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validate a character parameter — must be a single Han character.
 */
function validateCharacter(character: string): string | null {
  if (!character || typeof character !== "string") {
    return "Character parameter is required";
  }
  if (!HAN_CHAR_REGEX.test(character)) {
    return `"${character}" is not a valid Chinese character`;
  }
  return null;
}
