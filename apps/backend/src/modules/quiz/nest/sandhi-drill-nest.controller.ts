/**
 * @file apps/backend/src/modules/quiz/nest/sandhi-drill-nest.controller.ts
 * @description NestJS controller for the sandhi drill quiz surface (Story
 * 24-13 — Quiz + Progression Port). 1:1 mirror of `api/SandhiDrillController.ts`
 * (Express) — same `?count` parsing + validation, same service delegation,
 * same 2xx JSON (array of `DrillQuestion` objects), same 4xx/5xx
 * `code`/`message` (the global 24-3 `AppExceptionFilter` serializes thrown
 * `HttpException`s into the `{ code, message, requestId }` envelope; `code`/
 * `message` are byte-for-byte equal to the Express controller's legacy
 * `{ error, code }` body).
 *
 * Route (verbatim from `api/quizRoutes.ts` — ROUTE_PATTERNS.quizSandhiDrill):
 *   - `GET /v1/quiz/sandhi-drill/questions` → `@Get("sandhi-drill/questions")`
 *     → optionalAuth (the strategy pool is shared/public content).
 *
 * Story 21.17: Tone Sandhi Practice Quiz.
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Query,
  UseGuards,
} from "@nestjs/common";
import { createLogger } from "../../../shared/utils/logger.js";
import { SandhiDrillService } from "../strategies/SandhiDrillService.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";

const logger = createLogger("SandhiDrillNestController");

/**
 * NestJS controller for sandhi drill quiz endpoints (Story 21.17 / 24-13).
 */
@Controller("v1/quiz")
export class SandhiDrillNestController {
  constructor(
    @Inject(SandhiDrillService) private readonly sandhiDrillService: SandhiDrillService,
  ) {}

  /**
   * GET /v1/quiz/sandhi-drill/questions?count=10
   * Returns an array of sandhi drill `DrillQuestion` objects.
   */
  @Get("sandhi-drill/questions")
  @UseGuards(OptionalAuthGuard)
  async getQuestions(@Query("count") countQuery: unknown): Promise<unknown> {
    try {
      const countParam = typeof countQuery === "string" ? countQuery : "10";
      const count = parseInt(countParam, 10);

      if (isNaN(count) || count < 1) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Failed to load sandhi drill questions",
        });
      }

      const questions = await this.sandhiDrillService.generateQuestions(count);
      return questions;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      logger.error("Error generating sandhi drill questions", error);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load sandhi drill questions",
      });
    }
  }
}
