/**
 * @file apps/backend/src/modules/characters/nest/characters-nest.controller.ts
 * @description NestJS controller for character data endpoints (Story 24-8 —
 * Characters + Mnemonics Port).
 *
 * Mirrors `api/CharactersController.ts` (Express) 1:1 — same validation regex,
 * same service delegation, same 2xx JSON, same 4xx `code`/`message` (the
 * global 24-3 `AppExceptionFilter` serializes thrown `HttpException`s into the
 * `{ code, message, requestId }` envelope; `code`/`message` are byte-for-byte
 * equal to the Express controller's `{ error, code }` legacy body — `error`
 * is the legacy key superseded by the envelope, per the established 24-5
 * parity contract).
 *
 * ROUTE ORDER NOTE (parity-critical): `:glyph` is declared FIRST, exactly as
 * in `api/charactersRoutes.ts`. In Express (and Nest — both use path-to-regexp
 * matching in registration order), `GET /v1/characters/search` and
 * `GET /v1/characters/frequency` are matched by the `:glyph` route BEFORE the
 * literal `/search` / `/frequency` routes, so they return 400 "Invalid
 * character glyph" (glyph = "search"/"frequency" fails the CJK regex). This is
 * a PRE-EXISTING latent behavior on the live Express app (no frontend consumer
 * calls those two paths today) and is reproduced here byte-for-byte so the
 * Nest↔Express parity harness stays green. The `search`/`frequency` handlers
 * are still ported (declared after `:glyph`, so they shadow identically); the
 * underlying 2xx search/frequency logic is covered by the CharactersService
 * unit tests. If a future story reorders `charactersRoutes.ts`, the same
 * reorder here activates the full routes.
 *
 * Route patterns are copied verbatim from `api/charactersRoutes.ts`
 * (`ROUTE_PATTERNS.charactersByGlyph` / `charactersPhonetic` /
 * `charactersHomophones` / `charactersDecomposition` / `charactersSearch` /
 * `charactersFrequency`).
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { createLogger } from "../../../shared/utils/logger.js";
import { CharactersService } from "../services/CharactersService.js";
import {
  CharacterNotFoundError,
  PhoneticComponentNotFoundError,
  CharacterValidationError,
} from "../types/characters-errors.js";

// ── Constants (mirror the Express controller) ──────────────────────────────

/** Regex for validating a single Chinese character glyph. */
const CHINESE_CHAR_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]$/;

const logger = createLogger("CharactersNestController");

/**
 * NestJS controller for character detail endpoints (Story 24-8).
 */
@Controller("v1/characters")
export class CharactersNestController {
  constructor(@Inject(CharactersService) private readonly service: CharactersService) {}

  /**
   * GET /v1/characters/:glyph
   * Returns full character detail (pinyin, meanings, stroke count, radical, etc.).
   * Public data — no authentication required.
   */
  @Get(":glyph")
  async getCharacter(@Param("glyph") glyph: string): Promise<unknown> {
    const glyphValue = String(glyph);

    if (!glyphValue || !CHINESE_CHAR_REGEX.test(glyphValue)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid character glyph",
      });
    }

    try {
      return await this.service.getCharacter(glyphValue);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Character not found" });
      }
      logger.error(`Failed to get character detail for ${glyphValue}`, err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get character detail",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/phonetic
   * Returns phonetic component info (glyph, pinyin, meaning).
   * Public data — no authentication required.
   */
  @Get(":glyph/phonetic")
  async getPhonetic(@Param("glyph") glyph: string): Promise<unknown> {
    const glyphValue = String(glyph);

    if (!glyphValue || !CHINESE_CHAR_REGEX.test(glyphValue)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid character glyph",
      });
    }

    try {
      return await this.service.getPhoneticComponent(glyphValue);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Character not found" });
      }
      if (err instanceof PhoneticComponentNotFoundError) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: "No phonetic component found for this character",
        });
      }
      logger.error(`Failed to get phonetic component for ${glyphValue}`, err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get phonetic component",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/homophones
   * Returns all characters sharing the same pronunciation, grouped by reading.
   * Optional query param: ?exactTone=true to filter by exact tone match.
   * Public data — no authentication required.
   */
  @Get(":glyph/homophones")
  async getHomophones(
    @Param("glyph") glyph: string,
    @Query("exactTone") exactTone?: string,
  ): Promise<unknown> {
    const glyphValue = String(glyph);

    if (!glyphValue || !CHINESE_CHAR_REGEX.test(glyphValue)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid character glyph",
      });
    }

    try {
      const exact = exactTone === "true";
      return await this.service.getHomophones(glyphValue, exact);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Character not found" });
      }
      logger.error(`Failed to get homophones for ${glyphValue}`, err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get homophones",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph/decomposition
   * Returns the decomposition tree — constituent components with types.
   * Public data — no authentication required.
   */
  @Get(":glyph/decomposition")
  async getDecomposition(@Param("glyph") glyph: string): Promise<unknown> {
    const glyphValue = String(glyph);

    if (!glyphValue || !CHINESE_CHAR_REGEX.test(glyphValue)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid character glyph",
      });
    }

    try {
      return await this.service.getDecomposition(glyphValue);
    } catch (err) {
      if (err instanceof CharacterNotFoundError) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Character not found" });
      }
      logger.error(`Failed to get decomposition for ${glyphValue}`, err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get decomposition",
      });
    }
  }

  /**
   * GET /v1/characters/search?q=&tone=&hskLevel=
   * Search characters by pinyin, tone filter, or HSK level.
   * Requires at least one filter parameter.
   *
   * NOTE: declared AFTER `:glyph` to reproduce the Express route shadowing —
   * on both apps this path is matched by the `:glyph` handler first (400).
   * Public data — no authentication required.
   */
  @Get("search")
  async search(
    @Query("q") q?: string,
    @Query("tone") tone?: string,
    @Query("hskLevel") hskLevel?: string,
  ): Promise<unknown> {
    try {
      const result = await this.service.searchCharacters({ q, tone, hskLevel });
      return { data: result };
    } catch (err) {
      if (err instanceof CharacterValidationError) {
        throw new BadRequestException({ code: "VALIDATION_ERROR", message: err.message });
      }
      logger.error("Failed to search characters", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to search characters",
      });
    }
  }

  /**
   * GET /v1/characters/frequency?tier=&page=&pageSize=
   * Returns characters ordered by frequency rank, optionally filtered by HSK tier.
   *
   * NOTE: declared AFTER `:glyph` to reproduce the Express route shadowing —
   * on both apps this path is matched by the `:glyph` handler first (400).
   * Public data — no authentication required.
   */
  @Get("frequency")
  async getFrequency(
    @Query("tier") tier?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ): Promise<unknown> {
    const tierValue = tier ? parseInt(tier, 10) : undefined;
    const pageValue = page ? parseInt(page, 10) : 1;
    const pageSizeValue = pageSize ? parseInt(pageSize, 10) : 50;

    // Validate tier if provided
    if (tierValue !== undefined && (isNaN(tierValue) || tierValue < 1 || tierValue > 6)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Invalid tier parameter. Must be between 1 and 6.",
      });
    }

    try {
      return await this.service.getFrequencyList(tierValue, pageValue, pageSizeValue);
    } catch (err) {
      logger.error("Failed to get frequency list", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get frequency list",
      });
    }
  }
}
