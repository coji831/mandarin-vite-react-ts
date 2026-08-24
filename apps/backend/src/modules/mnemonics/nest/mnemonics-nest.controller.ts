/**
 * @file apps/backend/src/modules/mnemonics/nest/mnemonics-nest.controller.ts
 * @description NestJS controller for mnemonic story CRUD operations (Story
 * 24-8 — Characters + Mnemonics Port). The first consumer of the calibrated
 * `OptionalAuthGuard` (24-5) + the shared cache/gemini infra on the Nest shell.
 *
 * Same character/story validation, same service delegation, same 2xx JSON
 * (GET → `{ mnemonic }`, POST → 201 MnemonicStoryResponse, PUT → 200
 * MnemonicStoryResponse, DELETE → 204), same 4xx `code`/`message` (the global
 * 24-3 `AppExceptionFilter` serializes thrown `HttpException`s into the
 * `{ code, message, requestId }` envelope; `code`/`message` are byte-for-byte
 * equal to the previous surface's legacy `{ error, code, message }` body).
 *
 * Guard mapping:
 *   - `GET    /v1/mnemonics/:character` → `@UseGuards(OptionalAuthGuard)` —
 *     calibrated best-effort auth: a guest proceeds with `req.userId`
 *     UNDEFINED (never 401) and the 4-step lookup chain skips the user-edited
 *     branch, returning only shared/cached/static data — never another user's
 *     rows (F6: guest → session-local/empty). A valid token attaches the user.
 *   - `POST/PUT/DELETE /v1/mnemonics/:character` → `@UseGuards(RequireAuthGuard)`
 *     — guest-rejecting, matching Express `requireAuth` (401 AUTH_REQUIRED on a
 *     missing token, before the controller's own defense-in-depth `!userId`
 *     check — which is therefore unreachable under the guard but kept to mirror
 *     the Express controller structure).
 *
 * Read/write surface parity: POST/PUT exercise body-parsing (the shell mounts
 * the same `express.json()` limits as the shared app config — configure-app.ts,
 * 24-3), and PUT sanitizes HTML tags from user-submitted stories.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { MnemonicsService } from "../services/MnemonicsService.js";
import { MnemonicNotFoundError } from "../types/mnemonics.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";
import { RequireAuthGuard } from "../../../nest/guards/require-auth.guard.js";

// ── Constants (mirror the Express controller) ──────────────────────────────

/** Han character regex — matches a single CJK Unified Ideograph (U+4E00–U+9FFF). */
const HAN_CHAR_REGEX = /^[\u4e00-\u9fff]$/;

/** Maximum story length for user-submitted stories. */
const MAX_STORY_LENGTH = 1000;

const logger = createLogger("MnemonicsNestController");

/**
 * NestJS controller for mnemonic story CRUD operations (Story 24-8).
 */
@Controller("v1/mnemonics")
export class MnemonicsNestController {
  constructor(@Inject(MnemonicsService) private readonly mnemonicsService: MnemonicsService) {}

  /**
   * GET /v1/mnemonics/:character
   * Fetch a mnemonic story for a character.
   * Uses the 4-step lookup chain (user-edited → cache → DB(AI) → generate).
   * OptionalAuthGuard: guests can read shared/cached stories (step 1 skipped
   * for guests — `req.userId` stays undefined, so a guest NEVER sees another
   * user's edited story; F6 calibrated semantics).
   */
  @Get(":character")
  @UseGuards(OptionalAuthGuard)
  async getMnemonic(@Param("character") character: string, @Req() req: Request): Promise<unknown> {
    const characterValue = String(character);
    const userId = req.userId as string | undefined;

    // Validate character is a single Han character
    const validationError = validateCharacter(characterValue);
    if (validationError) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: validationError,
      });
    }

    try {
      const result = await this.mnemonicsService.getMnemonic(characterValue, userId);
      return { mnemonic: result };
    } catch (err) {
      if (err instanceof MnemonicNotFoundError) {
        // "No mnemonic yet" is a valid state (mnemonics are generated
        // on demand), not a client error — return a well-formed 200 so
        // clients don't treat it as a failure.
        return { mnemonic: null };
      }
      logger.error("Failed to fetch mnemonic story", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * POST /v1/mnemonics/:character
   * Generate a new mnemonic story for a character via AI.
   * requireAuth — guests never trigger vendor-cost AI generation (S11/P11).
   */
  @Post(":character")
  @HttpCode(201)
  @UseGuards(RequireAuthGuard)
  async generateMnemonic(
    @Param("character") character: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const characterValue = String(character);
    const userId = req.userId as string | undefined;

    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Authentication required",
      });
    }

    // Validate character
    const validationError = validateCharacter(characterValue);
    if (validationError) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: validationError,
      });
    }

    try {
      return await this.mnemonicsService.generateMnemonic(characterValue, userId);
    } catch (err) {
      // Differentiate between AI errors (503) and unexpected errors (500)
      if (
        err instanceof Error &&
        (err.message.includes("AI") ||
          err.message.includes("timeout") ||
          err.message.includes("Gemini"))
      ) {
        logger.warn("AI generation service error", err);
        throw new ServiceUnavailableException({
          code: "SERVICE_UNAVAILABLE",
          message: "AI generation service is temporarily unavailable. Please try again later.",
        });
      }
      logger.error("Failed to generate mnemonic story", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * PUT /v1/mnemonics/:character
   * Update (edit) a user's mnemonic story.
   * requireAuth — user-edited persistence is user-scoped.
   */
  @Put(":character")
  @UseGuards(RequireAuthGuard)
  async updateMnemonic(
    @Param("character") character: string,
    @Body() body: { story?: string; radicalIds?: string[] },
    @Req() req: Request,
  ): Promise<unknown> {
    const characterValue = String(character);
    const userId = req.userId as string | undefined;
    const { story, radicalIds } = body ?? {};

    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Authentication required",
      });
    }

    // Validate character
    const charValidationError = validateCharacter(characterValue);
    if (charValidationError) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: charValidationError,
      });
    }

    // Validate story
    if (!story || typeof story !== "string" || story.trim().length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Story is required and must be a non-empty string",
      });
    }

    if (story.length > MAX_STORY_LENGTH) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `Story must be ${MAX_STORY_LENGTH} characters or fewer`,
      });
    }

    // Validate radicalIds if provided
    if (radicalIds !== undefined) {
      if (!Array.isArray(radicalIds) || !radicalIds.every((id) => typeof id === "string")) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "radicalIds must be an array of strings",
        });
      }
    }

    // Sanitize HTML tags from user-submitted story
    const sanitizedStory = story.replace(/<[^>]*>/g, "").trim();

    try {
      return await this.mnemonicsService.updateMnemonic(
        characterValue,
        userId,
        sanitizedStory,
        radicalIds,
      );
    } catch (err) {
      logger.error("Failed to update mnemonic story", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }

  /**
   * DELETE /v1/mnemonics/:character
   * Reset a user's mnemonic story (delete the user-edited version).
   * requireAuth — user-scoped reset.
   */
  @Delete(":character")
  @HttpCode(204)
  @UseGuards(RequireAuthGuard)
  async resetMnemonic(@Param("character") character: string, @Req() req: Request): Promise<void> {
    const characterValue = String(character);
    const userId = req.userId as string | undefined;

    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Authentication required",
      });
    }

    // Validate character
    const validationError = validateCharacter(characterValue);
    if (validationError) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: validationError,
      });
    }

    try {
      await this.mnemonicsService.resetMnemonic(characterValue, userId);
    } catch (err) {
      logger.error("Failed to reset mnemonic story", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  }
}

// ── Helpers (mirror the Express controller) ─────────────────────────────────

/**
 * Validate a character parameter — must be a single Han character.
 */
function validateCharacter(character: string): string | null {
  if (!character || typeof character !== "string") {
    return "Character parameter is required";
  }
  if (!HAN_CHAR_REGEX.test(character)) {
    return `"${character}" is not a valid Chinese character`;
  }
  return null;
}
