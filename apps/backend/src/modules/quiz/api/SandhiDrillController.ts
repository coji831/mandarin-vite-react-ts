/**
 * @file apps/backend/src/modules/quiz/api/SandhiDrillController.ts
 * @description HTTP controller for sandhi drill quiz endpoints.
 *
 * Story 21.17: Tone Sandhi Practice Quiz
 * GET /v1/quiz/sandhi-drill/questions?count=10
 */

import type { Request, Response } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { SandhiDrillService } from "../strategies/SandhiDrillService.js";

const logger = createLogger("SandhiDrillController");

export class SandhiDrillController {
  private sandhiDrillService: SandhiDrillService;

  constructor(sandhiDrillService?: SandhiDrillService) {
    this.sandhiDrillService = sandhiDrillService ?? new SandhiDrillService();
    this.getQuestions = this.getQuestions.bind(this);
  }

  /**
   * GET /v1/quiz/sandhi-drill/questions?count=10
   * Returns an array of sandhi drill DrillQuestion objects.
   */
  async getQuestions(req: Request, res: Response): Promise<Response> {
    try {
      const countParam = typeof req.query.count === "string" ? req.query.count : "10";
      const count = parseInt(countParam, 10);

      if (isNaN(count) || count < 1) {
        return res.status(400).json({
          error: "Failed to load sandhi drill questions",
          code: "VALIDATION_ERROR",
        });
      }

      const questions = await this.sandhiDrillService.generateQuestions(count);
      return res.json(questions);
    } catch (error) {
      logger.error("Error generating sandhi drill questions", error);
      return res.status(500).json({
        error: "Failed to load sandhi drill questions",
        code: "LOAD_ERROR",
      });
    }
  }
}
