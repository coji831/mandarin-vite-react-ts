/**
 * @file apps/backend/src/modules/foundations/api/FoundationsController.js
 * @description Controller for foundations data endpoints
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("FoundationsController");

export class FoundationsController {
  constructor(foundationsService) {
    this.foundationsService = foundationsService;
  }

  async getPinyinTonesPool(req, res) {
    try {
      const pool = await this.foundationsService.getPinyinTonesPool();
      res.json(pool);
    } catch (err) {
      logger.error("Failed to load pinyin-tones pool", err);
      res.status(500).json({ error: "Failed to load pinyin-tones data" });
    }
  }

  async getPinyinCharacterMap(req, res) {
    try {
      const map = await this.foundationsService.getPinyinCharacterMap();
      res.json(map);
    } catch (err) {
      logger.error("Failed to load pinyin character map", err);
      res.status(500).json({ error: "Failed to load character map" });
    }
  }

  async getStrokesReference(req, res) {
    try {
      const data = await this.foundationsService.getStrokesReference();
      res.json(data);
    } catch (err) {
      logger.error("Failed to load strokes reference", err);
      res.status(500).json({ error: "Failed to load strokes data" });
    }
  }
}
