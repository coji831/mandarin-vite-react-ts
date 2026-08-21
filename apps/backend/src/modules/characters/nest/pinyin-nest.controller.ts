/**
 * @file apps/backend/src/modules/characters/nest/pinyin-nest.controller.ts
 * @description NestJS controller for pinyin search endpoints (Story 24-8 —
 * Characters + Mnemonics Port).
 *
 * Mirrors `api/PinyinController.ts` (Express) 1:1 — same query validation
 * (`q` required, `tone` 1–5), same service delegation, same 2xx JSON, same
 * 4xx `code`/`message` (the global 24-3 `AppExceptionFilter` serializes thrown
 * `HttpException`s into the `{ code, message, requestId }` envelope; `code`/
 * `message` are byte-for-byte equal to the Express controller's legacy
 * `{ error, code }` body).
 *
 * Route pattern is copied verbatim from `api/pinyinRoutes.ts`
 * (`ROUTE_PATTERNS.pinyinSearch` — `GET /v1/pinyin/search`). Unlike the
 * characters router, `pinyinRoutes.ts` registers ONLY `/search` (no `:glyph`
 * sibling), so this route is NOT shadowed and returns a real 2xx.
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Query,
} from "@nestjs/common";
import { createLogger } from "../../../shared/utils/logger.js";
import { PinyinSearchService } from "../services/PinyinSearchService.js";
import { PinyinValidationError } from "../types/pinyin.js";

const logger = createLogger("PinyinNestController");

/**
 * NestJS controller for pinyin search endpoints (Story 24-8).
 */
@Controller("v1/pinyin")
export class PinyinNestController {
  constructor(@Inject(PinyinSearchService) private readonly service: PinyinSearchService) {}

  /**
   * GET /v1/pinyin/search
   * Search characters by pinyin query.
   * Params: q (required), tone (optional 1-5), page, pageSize.
   * Public data — no authentication required.
   */
  @Get("search")
  async search(
    @Query("q") q?: string,
    @Query("tone") tone?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<unknown> {
    const qValue = q;
    const toneValue = tone ? parseInt(tone, 10) : undefined;
    const pageValue = page ? parseInt(page, 10) : 1;
    const pageSizeValue = pageSize ? parseInt(pageSize, 10) : 50;

    // Validate q is provided
    if (!qValue || qValue.trim().length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Query parameter 'q' is required",
      });
    }

    // Validate tone if provided
    if (toneValue !== undefined && (isNaN(toneValue) || toneValue < 1 || toneValue > 5)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid tone parameter. Must be between 1 and 5.",
      });
    }

    try {
      return await this.service.search({
        q: qValue,
        tone: toneValue,
        page: pageValue,
        pageSize: pageSizeValue,
      });
    } catch (err) {
      if (err instanceof PinyinValidationError) {
        throw new BadRequestException({ code: "VALIDATION_ERROR", message: err.message });
      }
      logger.error("Failed to search pinyin", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to search pinyin",
      });
    }
  }
}
