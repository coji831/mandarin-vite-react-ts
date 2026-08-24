/**
 * @file apps/backend/src/modules/radicals/nest/radicals-nest.controller.ts
 * @description NestJS controller for radicals data endpoints (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * Same service delegation, same 2xx JSON, same 4xx `code`/`message` (the
 * global 24-3 `AppExceptionFilter` serializes thrown `HttpException`s into the
 * `{ code, message, requestId }` envelope; `code`/`message` are byte-for-byte
 * equal to the previous surface's `{ error, code }` legacy body — `error` is
 * the legacy key superseded by the envelope, per the established 24-5 parity
 * contract).
 *
 * ROUTE ORDER parity: the four handlers are declared in the same order as the
 * four route registrations (`/`, `/:radicalId`, `/character/:glyph`,
 * `/:radicalId/characters`) so the shell's Express router registration order
 * matches the previous surface exactly (both use path-to-regexp
 * first-match-wins; e.g. `GET /v1/radicals/character` is captured by
 * `/:radicalId` → 404 on both apps — a pre-existing latent, reproduced).
 *
 * `GET /:radicalId` NOT-FOUND PARITY NOTE: the handler calls `res.json(radical)`
 * where the service returns `null` for an unknown ID — a 200 with a literal
 * `null` JSON body. Nest's default reply path strips `null`/`undefined`
 * (`ExpressAdapter.reply`: `isNil(body)` → `response.send()`, empty body), so
 * this handler takes full `@Res()` control and calls `res.json()` directly —
 * a byte-for-byte mirror that preserves the `200 null` wire body on BOTH apps.
 * The thrown 404 still flows through the global `AppExceptionFilter` (it
 * writes via `ctx.getResponse()`, independent of `@Res`).
 */

import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { RadicalsService } from "../services/RadicalsService.js";
import { RadicalCharacterService } from "../services/RadicalCharacterService.js";
import { RadicalNotFoundError } from "../types/radicals-errors.js";

const logger = createLogger("RadicalsNestController");

/**
 * NestJS controller for radicals data endpoints (Story 24-9).
 */
@Controller("v1/radicals")
export class RadicalsNestController {
  constructor(
    @Inject(RadicalsService) private readonly radicalsService: RadicalsService,
    @Inject(RadicalCharacterService)
    private readonly radicalCharacterService: RadicalCharacterService,
  ) {}

  /**
   * GET /v1/radicals
   * Returns all radicals from the Radical reference table.
   * Public static reference data — no authentication required.
   */
  @Get()
  async getAllRadicals(): Promise<unknown> {
    try {
      return await this.radicalsService.getAllRadicals();
    } catch (err) {
      logger.error("Failed to load radicals", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load radicals",
      });
    }
  }

  /**
   * GET /v1/radicals/:radicalId
   * Returns a single radical by business-key ID (e.g. "rad_0001").
   * Unknown IDs return `200 null` — identical to Express `res.json(null)`.
   * Public static reference data — no authentication required.
   */
  @Get(":radicalId")
  async getRadicalById(@Param("radicalId") radicalId: string, @Res() res: Response): Promise<void> {
    try {
      const radical = await this.radicalsService.getRadicalById(String(radicalId));
      // Full @Res() mirror of the Express `res.json(radical)` — preserves the
      // `200 null` wire body for unknown IDs (Nest's default reply would strip it).
      res.json(radical);
    } catch (err) {
      logger.error(`Failed to load radical ${radicalId}`, err);
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Failed to load radicals",
      });
    }
  }

  /**
   * GET /v1/radicals/character/:glyph
   * Returns radicals that compose the given character glyph.
   * Public static reference data — no authentication required.
   */
  @Get("character/:glyph")
  async getRadicalsByCharacter(@Param("glyph") glyph: string): Promise<unknown> {
    try {
      return await this.radicalsService.getRadicalsByCharacter(String(glyph));
    } catch (err) {
      logger.error(`Failed to load radicals for character ${glyph}`, err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load radicals for character",
      });
    }
  }

  /**
   * GET /v1/radicals/:radicalId/characters
   * Returns characters associated with the given radical.
   * Public static reference data — no authentication required.
   */
  @Get(":radicalId/characters")
  async getCharactersForRadical(@Param("radicalId") radicalId: string): Promise<unknown> {
    try {
      return await this.radicalCharacterService.getCharactersForRadical(String(radicalId));
    } catch (err) {
      if (err instanceof RadicalNotFoundError) {
        logger.error(`Failed to load radical characters: ${radicalId}`, err);
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: "Failed to load radical characters",
        });
      }
      logger.error(`Failed to load radical characters for ${radicalId}`, err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to load radical characters",
      });
    }
  }
}
