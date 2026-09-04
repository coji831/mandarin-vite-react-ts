/**
 * @file apps/backend/src/modules/words/nest/words-nest.controller.ts
 * @description NestJS controller for the Words module (Story 24-2 shell).
 *
 * Same validation regexes, same service delegation, same 2xx JSON. The Nest
 * controller calls the framework-agnostic services directly (no controller-on-
 * request pattern) and throws `BadRequestException` / `NotFoundException` on
 * 4xx (body-envelope parity `{ error, code }` is deferred to 24-3).
 *
 * Routes: `ROUTE_PATTERNS.wordsByGlyph(":glyph")` + `ROUTE_PATTERNS.wordsMeasureWords(":id")`.
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { createLogger } from "../../../shared/utils/logger.js";
import { WordsService } from "../services/WordsService.js";
import { MeasureWordService } from "../services/MeasureWordService.js";
import { WordNotFoundError, WordIdNotFoundError } from "../types/words-errors.js";

// ── Constants ──────────────────────────────────────────────────────────────

/** Regex for validating a Chinese glyph (one or more CJK Unified Ideographs). */
const CHINESE_GLYPH_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]+$/;

/** Regex matching a Word ID format (w_XXXX). */
const WORD_ID_REGEX = /^w_\w+$/;

const logger = createLogger("WordsNestController");

/**
 * NestJS controller for word detail operations (Story 24-2 shell).
 */
@Controller("v1/words")
export class WordsNestController {
  constructor(
    @Inject(WordsService) private readonly wordsService: WordsService,
    @Inject(MeasureWordService) private readonly measureWordService: MeasureWordService,
  ) {}

  /**
   * GET /api/v1/words/:glyph
   * Fetch full word detail including pinyin, definitions, HSK level,
   * and constituent characters.
   */
  @Get(":glyph")
  async getWordDetail(@Param("glyph") glyph: string): Promise<{ data: unknown }> {
    const glyphValue = String(glyph);

    // Validate glyph contains only Chinese characters
    if (!glyphValue || !CHINESE_GLYPH_REGEX.test(glyphValue)) {
      throw new BadRequestException();
    }

    try {
      const result = await this.wordsService.getWordDetail(glyphValue);
      return { data: result };
    } catch (err) {
      if (err instanceof WordNotFoundError) {
        throw new NotFoundException();
      }
      logger.error(`Failed to load word detail for ${glyphValue}`, err);
      throw new InternalServerErrorException();
    }
  }

  /**
   * GET /api/v1/words/:id/measure-words
   * Fetch measure words (量词) associated with a given word ID.
   */
  @Get(":id/measure-words")
  async getMeasureWords(@Param("id") id: string): Promise<unknown> {
    const wordId = String(id);

    if (!wordId || !WORD_ID_REGEX.test(wordId)) {
      throw new BadRequestException();
    }

    try {
      return await this.measureWordService.getMeasureWordsForWord(wordId);
    } catch (err) {
      if (err instanceof WordIdNotFoundError) {
        throw new NotFoundException();
      }
      logger.error(`Failed to load measure words for ${wordId}`, err);
      throw new InternalServerErrorException();
    }
  }
}
