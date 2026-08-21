/**
 * @file apps/backend/src/modules/foundations/nest/foundations-nest.controller.ts
 * @description NestJS controller for foundations data endpoints (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * Mirrors `api/FoundationsController.ts` (Express) 1:1 — same service
 * delegation, same 2xx JSON, same 4xx `message` (the global 24-3
 * `AppExceptionFilter` serializes thrown `HttpException`s into the
 * `{ code, message, requestId }` envelope). The Express foundations controller
 * emits PLAIN `{ error }` bodies (no `code`), so the Nest envelope supplies a
 * `code` per the backend error-message convention (`VALIDATION_ERROR` / 400,
 * `NOT_FOUND` / 404, `LOAD_ERROR` / 500) while `message` is byte-for-byte equal
 * to the Express `error` text — the established envelope-vs-legacy contract.
 *
 * FOUR routes — one controller with `@Controller("v1")` covering both route
 * prefixes the Express route file spans:
 *   - `GET /v1/foundations/data/pinyin-tones`
 *   - `GET /v1/foundations/data/pinyin-character-map`
 *   - `GET /v1/foundations/data/strokes`
 *   - `GET /v1/characters/:glyph`  ← the CROSS-MODULE SHADOW route (see below)
 *
 * ROUTE-SHADOWING PARITY (`GET /v1/characters/:glyph`): in the Express app this
 * route lives on the FOUNDATIONS router, which is mounted BEFORE the characters
 * router in `src/app/routes.ts` — so foundations' `characters/:glyph` captures
 * every single-segment `GET /v1/characters/<x>` on the live path, shadowing the
 * characters module's own `:glyph` (+ its `/search` / `/frequency`) handlers.
 * To reproduce this on the shell, `FoundationsModule` is imported BEFORE
 * `CharactersModule` in `app.module.ts` (Nest registers routes in module import
 * order onto the same Express router; first-match-wins, no conflict detector
 * fires — the two controllers' `:glyph` routes simply coexist in registration
 * order). Result: `GET /v1/characters/search` / `/frequency` / `<non-CJK>`
 * return the foundations 404 `Character "<x>" not found`, byte-for-byte like
 * Express. The characters `:glyph` handler remains registered (later) and is
 * reactivated only if foundations is ever removed or reordered.
 *
 * The `getCharacterByGlyph` 400 branch (`!glyphParam || Array.isArray(...)`)
 * is ported for controller fidelity but is UNREACHABLE over HTTP — Express's
 * `:glyph` is a required single-segment param, so it is always a string.
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
import { FoundationsService } from "../services/FoundationsService.js";

const logger = createLogger("FoundationsNestController");

/**
 * NestJS controller for foundations data endpoints (Story 24-9).
 */
@Controller("v1")
export class FoundationsNestController {
  constructor(
    @Inject(FoundationsService) private readonly foundationsService: FoundationsService,
  ) {}

  /**
   * GET /v1/foundations/data/pinyin-tones
   * Returns the full pinyin + tones reference data pool (all-in-DB).
   * Public static reference data — no authentication required.
   */
  @Get("foundations/data/pinyin-tones")
  async getPinyinTonesPool(): Promise<unknown> {
    try {
      return await this.foundationsService.getPinyinTonesPool();
    } catch (err) {
      logger.error("Failed to load pinyin-tones pool", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load pinyin-tones pool",
      });
    }
  }

  /**
   * GET /v1/foundations/data/pinyin-character-map
   * Returns a pinyin syllable -> Chinese character mapping for TTS audio.
   * Public static reference data — no authentication required.
   */
  @Get("foundations/data/pinyin-character-map")
  async getPinyinCharacterMap(): Promise<unknown> {
    try {
      return await this.foundationsService.getPinyinCharacterMap();
    } catch (err) {
      logger.error("Failed to load pinyin character map", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load pinyin character map",
      });
    }
  }

  /**
   * GET /v1/foundations/data/strokes
   * Returns the strokes reference data (basic strokes, stroke order rules,
   * suggested characters).
   * Public static reference data — no authentication required.
   */
  @Get("foundations/data/strokes")
  async getStrokesReference(): Promise<unknown> {
    try {
      return await this.foundationsService.getStrokesReference();
    } catch (err) {
      logger.error("Failed to load strokes reference", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load strokes reference",
      });
    }
  }

  /**
   * GET /v1/characters/:glyph
   * Returns character detail data (readings, etymology, HSK level, stroke
   * count, etc.) — served by foundations, which shadows the characters module's
   * single-segment `:glyph` on the live path (see the class docstring).
   * Public static reference data — no authentication required.
   */
  @Get("characters/:glyph")
  async getCharacterByGlyph(@Param("glyph") glyphParam: string): Promise<unknown> {
    // Mirror the Express controller verbatim — including the (HTTP-unreachable)
    // missing/array glyph guard.
    if (!glyphParam || Array.isArray(glyphParam)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Glyph parameter is required",
      });
    }
    try {
      const data = await this.foundationsService.getCharacterByGlyph(
        decodeURIComponent(glyphParam),
      );
      if (!data) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: `Character "${glyphParam}" not found`,
        });
      }
      return data;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      logger.error("Failed to get character by glyph", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to get character data",
      });
    }
  }
}
