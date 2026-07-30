/**
 * @file apps/backend/src/modules/radicals/api/RadicalsController.ts
 * @description Controller for radicals data endpoints
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { RadicalNotFoundError } from "../types/radicals-errors.js";
import type { Request, Response } from "express";
import type { RadicalCharacterService } from "../services/RadicalCharacterService.js";

const logger = createLogger("RadicalsController");

export class RadicalsController {
  private radicalsService: import("../services/RadicalsService.js").RadicalsService;
  private radicalCharacterService: RadicalCharacterService;

  constructor(
    radicalsService: import("../services/RadicalsService.js").RadicalsService,
    radicalCharacterService: RadicalCharacterService,
  ) {
    this.radicalsService = radicalsService;
    this.radicalCharacterService = radicalCharacterService;
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
      const radicalId = String(req.params.radicalId);
      const radical = await this.radicalsService.getRadicalById(radicalId);
      res.json(radical);
    } catch (err) {
      logger.error(`Failed to load radical ${req.params.radicalId}`, err);
      res.status(404).json({ error: "Failed to load radicals", code: "NOT_FOUND" });
    }
  }

  async getRadicalsByCharacter(req: Request, res: Response): Promise<void> {
    try {
      const glyph = String(req.params.glyph);
      const radicals = await this.radicalsService.getRadicalsByCharacter(glyph);
      res.json(radicals);
    } catch (err) {
      logger.error(`Failed to load radicals for character ${req.params.glyph}`, err);
      res.status(500).json({ error: "Failed to load radicals for character", code: "LOAD_ERROR" });
    }
  }

  async getCharactersForRadical(req: Request, res: Response): Promise<void> {
    try {
      const radicalId = String(req.params.radicalId);
      const result = await this.radicalCharacterService.getCharactersForRadical(radicalId);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof RadicalNotFoundError) {
        logger.error(`Failed to load radical characters: ${req.params.radicalId}`, err);
        res.status(404).json({ error: "Failed to load radical characters", code: "NOT_FOUND" });
        return;
      }
      logger.error(`Failed to load radical characters for ${req.params.radicalId}`, err);
      res.status(500).json({ error: "Failed to load radical characters", code: "LOAD_ERROR" });
    }
  }
}
