/**
 * @file apps/backend/src/modules/radicals/api/RadicalsController.js
 * @description Controller for radicals data endpoints
 */
import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("RadicalsController");

export class RadicalsController {
  private radicalsService: any;

  constructor(radicalsService: any) {
    this.radicalsService = radicalsService;
  }

  async getAllRadicals(req: Request, res: Response): Promise<void> {
    try {
      const radicals = await this.radicalsService.getAllRadicals();
      res.json(radicals);
    } catch (err) {
      logger.error("Failed to load radicals", err);
      res.status(500).json({ error: "Failed to load radicals", code: "LOAD_ERROR" });
    }
  }

  async getRadicalById(req: Request, res: Response): Promise<void> {
    try {
      const { radicalId } = req.params;
      const radical = await this.radicalsService.getRadicalById(radicalId);
      res.json(radical);
    } catch (err) {
      logger.error(`Failed to load radical ${req.params.radicalId}`, err);
      res.status(404).json({ error: "Failed to load radicals", code: "NOT_FOUND" });
    }
  }

  async getRadicalsByCharacter(req: Request, res: Response): Promise<void> {
    try {
      const { glyph } = req.params;
      const radicals = await this.radicalsService.getRadicalsByCharacter(glyph);
      res.json(radicals);
    } catch (err) {
      logger.error(`Failed to load radicals for character ${req.params.glyph}`, err);
      res.status(500).json({ error: "Failed to load radicals for character", code: "LOAD_ERROR" });
    }
  }
}
