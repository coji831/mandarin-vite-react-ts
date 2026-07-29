/**
 * @file apps/backend/src/modules/readers/api/ReadersController.ts
 * @description Controller for reading passage endpoints.
 *
 * Clean Architecture: API / Controller layer.
 * Handles input validation and HTTP responses only.
 * Delegates business logic to ReadersService.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";
import type { ReadersService } from "../services/ReadersService.js";
import type {
  PassageResponseData,
  WordSegment,
  HskProfile,
  EnrichedSentence,
  PassageRecord,
} from "../types/readers.js";
import {
  PassageNotFoundError,
  RateLimitExceededError,
  PassageGenerationError,
} from "../types/readers-errors.js";

const logger = createLogger("ReadersController");

/**
 * Controller for reading passage CRUD and generation operations.
 */
export class ReadersController {
  private readersService: ReadersService;

  constructor(readersService: ReadersService) {
    this.readersService = readersService;
  }

  /**
   * Format a passage service result into the standard API response shape.
   * Strips the raw `content` field and serializes Date objects to ISO strings.
   */
  private formatPassageResponse(result: {
    passage: PassageRecord;
    segments: WordSegment[];
    hskProfile: HskProfile;
    enrichedSentences: EnrichedSentence[];
  }): { data: PassageResponseData } {
    const { content: _content, ...passageWithoutContent } = result.passage;
    return {
      data: {
        ...passageWithoutContent,
        generatedAt: result.passage.generatedAt.toISOString(),
        createdAt: result.passage.createdAt.toISOString(),
        updatedAt: result.passage.updatedAt.toISOString(),
        lastAccessedAt: result.passage.lastAccessedAt?.toISOString() ?? null,
        sentences: result.enrichedSentences,
        segments: result.segments,
        hskProfile: result.hskProfile,
      },
    };
  }

  /**
   * GET /v1/readers/passages
   * List passages, optionally filtered by ?hskLevel=N.
   */
  async listPassages(req: Request, res: Response): Promise<void> {
    try {
      const hskLevel = req.query.hskLevel ? Number(req.query.hskLevel) : undefined;
      const userId = req.userId;

      // Validate hskLevel if provided
      if (
        req.query.hskLevel !== undefined &&
        (isNaN(Number(hskLevel)) || (hskLevel as number) < 1 || (hskLevel as number) > 6)
      ) {
        res.status(400).json({
          error: "Failed to list passages",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const passages = await this.readersService.listPassages(hskLevel, userId);
      res.json({ data: passages });
    } catch (err) {
      logger.error("Failed to list passages", err);
      res.status(500).json({
        error: "Failed to list passages",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * GET /v1/readers/passages/:id
   * Get a single passage with segmented result and HSK profile.
   */
  async getPassage(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const userId = req.userId;

      if (!id) {
        res.status(400).json({
          error: "Failed to get passage",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.readersService.getPassage(id, userId);
      res.json(this.formatPassageResponse(result));
    } catch (err) {
      if (err instanceof PassageNotFoundError) {
        res.status(404).json({
          error: "Failed to get passage",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error("Failed to get passage", err);
      res.status(500).json({
        error: "Failed to get passage",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * POST /v1/readers/passages/:id/audio
   * Get audio URLs for all sentences in a passage.
   * Returns per-sentence source status — never 5xx for audio infra failures.
   */
  async getPassageAudio(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      if (!id) {
        res.status(400).json({
          error: "Failed to get passage audio",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.readersService.getPassageAudio(id);
      res.json({ data: result });
    } catch (err) {
      if (err instanceof PassageNotFoundError) {
        res.status(404).json({
          error: "Failed to get passage audio",
          code: "NOT_FOUND",
        });
        return;
      }
      logger.error("Failed to get passage audio", err);
      res.status(500).json({
        error: "Failed to get passage audio",
        code: "LOAD_ERROR",
      });
    }
  }

  /**
   * POST /v1/readers/generate
   * Generate a new passage on a given topic.
   * Auth-only. Body: { topic: string }.
   */
  async generatePassage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({
          error: "Failed to generate passage",
          code: "AUTH_ERROR",
        });
        return;
      }

      const { topic } = req.body;

      // Validate topic
      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        res.status(400).json({
          error: "Failed to generate passage",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      if (topic.length > 100) {
        res.status(400).json({
          error: "Failed to generate passage",
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await this.readersService.generatePassage(topic.trim(), userId);
      res.status(201).json(this.formatPassageResponse(result));
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        res.status(429).json({
          error: "Failed to generate passage",
          code: "RATE_LIMIT",
        });
        return;
      }
      if (err instanceof PassageGenerationError) {
        res.status(502).json({
          error: "Failed to generate passage",
          code: "GENERATION_ERROR",
        });
        return;
      }
      logger.error("Failed to generate passage", err);
      res.status(500).json({
        error: "Failed to generate passage",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
