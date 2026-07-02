/**
 * @file apps/backend/src/modules/foundations/api/FoundationsController.js
 * @description Controller for foundations data endpoints
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("FoundationsController");

export class FoundationsController {
  private foundationsService: any;

  constructor(foundationsService: any) {
    this.foundationsService = foundationsService;
  }

  async getPinyinTonesPool(req: Request, res: Response): Promise<void> {
    try {
      const pool = await this.foundationsService.getPinyinTonesPool();
      res.json(pool);
    } catch (err) {
      logger.error("Failed to load pinyin-tones pool", err);
      res.status(500).json({ error: "Failed to load pinyin-tones pool" });
    }
  }

  async getPinyinCharacterMap(req: Request, res: Response): Promise<void> {
    try {
      const map = await this.foundationsService.getPinyinCharacterMap();
      res.json(map);
    } catch (err) {
      logger.error("Failed to load pinyin character map", err);
      res.status(500).json({ error: "Failed to load pinyin character map" });
    }
  }

  async getStrokesReference(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.foundationsService.getStrokesReference();
      res.json(data);
    } catch (err) {
      logger.error("Failed to load strokes reference", err);
      res.status(500).json({ error: "Failed to load strokes reference" });
    }
  }
}
