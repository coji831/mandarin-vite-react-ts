/**
 * @file apps/backend/src/modules/examples/api/ExamplesController.js
 * @description HTTP-layer controller for example generation and audio endpoints
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ExamplesController");

/**
 * ExamplesController
 * Handles HTTP requests for example generation and audio retrieval.
 * Delegates all business logic to the injected example service.
 */
export class ExamplesController {
  /**
   * @param {Object} exampleService - Service implementing generateSingleLineExample and getOrGenerateAudio
   */
  constructor(exampleService) {
    this.exampleService = exampleService;

    this.generateSingleLine = this.generateSingleLine.bind(this);
    this.getAudio = this.getAudio.bind(this);
  }

  /**
   * POST /api/v1/examples/single-line
   * Generate a single-line example for a given word
   */
  async generateSingleLine(req, res) {
    const payload = req.body;
    const result = await this.exampleService.generateSingleLineExample(payload);
    res.status(200).json({ data: result });
  }

  /**
   * GET /api/v1/examples/audio
   * Return cached audio URL or generate new audio via TTS
   */
  async getAudio(req, res) {
    const { cacheKey } = req.query;

    if (!cacheKey || typeof cacheKey !== "string") {
      return res.status(400).json({ error: "Missing or invalid cacheKey" });
    }

    try {
      const audioUrl = await this.exampleService.getOrGenerateAudio(cacheKey);
      res.status(200).json({ audio_url: audioUrl });
    } catch (err) {
      logger.error("Audio endpoint error", { cacheKey, err: err?.message });
      throw err;
    }
  }
}
