/**
 * @file apps/backend/src/modules/readers/nest/readers-nest.controller.ts
 * @description NestJS controller for the readers module (Story 24-12 — Readers
 * Port). All 11 routes verbatim: same query/body/path parsing + string
 * coercion, same service delegation, same 2xx JSON (incl.
 * `formatPassageResponse` date serialization), same 4xx/5xx `code`/`message`
 * (the global 24-3 `AppExceptionFilter` serializes thrown `HttpException`s
 * into the `{ code, message, requestId }` envelope; `code`/`message` are
 * byte-for-byte equal to the previous surface's legacy `{ error, code }` body).
 *
 * Routes (ROUTE_PATTERNS):
 *   - `GET    /v1/readers/passages`                    → optionalAuth (F5)
 *   - `GET    /v1/readers/passages/:id`                → optionalAuth (F5)
 *   - `POST   /v1/readers/passages/:id/audio`          → optionalAuth (calibrated F5: cache-first free for guests)
 *   - `POST   /v1/readers/generate`                    → requireAuth (5/day DB-backed limit)
 *   - `GET    /v1/readers/sessions/:passageId`         → requireAuth
 *   - `PUT    /v1/readers/sessions/:passageId`         → requireAuth
 *   - `POST   /v1/readers/sessions/:passageId/complete`→ requireAuth
 *   - `GET    /v1/readers/bookmarks`                   → requireAuth
 *   - `POST   /v1/readers/bookmarks`                   → requireAuth
 *   - `DELETE /v1/readers/bookmarks/by-passage/:passageId` → requireAuth
 *   - `GET    /v1/readers/bookmarks/by-passage/:passageId` → requireAuth
 *
 * Guard mapping:
 * the three public-ish
 * reads (`passages`, `passages/:id`, `passages/:id/audio`) → the CALIBRATED
 * `OptionalAuthGuard` (24-5) — a guest (no/bad token) proceeds with
 * `req.userId` UNDEFINED, never 401 (F5 cache-first free-for-guests on the
 * audio route). The user-scoped / cost-bearing routes (generate, sessions,
 * bookmarks) → `RequireAuthGuard` (calibrated guest-rejecting: 401
 * `AUTH_REQUIRED` before the controller, matching Express `requireAuth`).
 *
 * The `if (!userId)` 401 `AUTH_ERROR` checks on the user-scoped routes are
 * defense-in-depth (unreachable under `RequireAuthGuard`). Status-code parity:
 * `@HttpCode(200)` on the POST audio/complete routes (Nest's POST default
 * 201), `@HttpCode(201)` on generate/addBookmark (the previous surface used
 * `res.status(201)`), `@HttpCode(204)` on the bookmark DELETE (the previous
 * surface used `res.status(204).send()`).
 */

import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { ReadersService } from "../services/ReadersService.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";
import { RequireAuthGuard } from "../../../nest/guards/require-auth.guard.js";
import {
  PassageNotFoundError,
  RateLimitExceededError,
  PassageGenerationError,
} from "../types/readers-errors.js";
import type {
  PassageResponseData,
  WordSegment,
  HskProfile,
  EnrichedSentence,
  PassageRecord,
} from "../types/readers.js";
import type { PassageAudioResponse } from "../types/readers-audio.js";

const logger = createLogger("ReadersNestController");

/**
 * NestJS controller for the readers module (Story 24-12).
 */
@Controller("v1/readers")
export class ReadersNestController {
  constructor(@Inject(ReadersService) private readonly readersService: ReadersService) {}

  /**
   * Format a passage service result into the standard API response shape —
   * byte-for-byte the Express `ReadersController.formatPassageResponse`: strips
   * the raw `content` field and serializes Date objects to ISO strings.
   */
  private formatPassageResponse(result: {
    passage: PassageRecord;
    segments: WordSegment[];
    hskProfile: HskProfile;
    enrichedSentences: EnrichedSentence[];
  }): { data: PassageResponseData } {
    const { content: _content, ...passageWithoutContent } = result.passage;
    return {
      data: {
        ...passageWithoutContent,
        generatedAt: result.passage.generatedAt.toISOString(),
        createdAt: result.passage.createdAt.toISOString(),
        updatedAt: result.passage.updatedAt.toISOString(),
        lastAccessedAt: result.passage.lastAccessedAt?.toISOString() ?? null,
        sentences: result.enrichedSentences,
        segments: result.segments,
        hskProfile: result.hskProfile,
      },
    };
  }

  /**
   * GET /v1/readers/passages
   * List passages, optionally filtered by ?hskLevel=N. optionalAuth (F5) — a
   * guest lists shared passages; an authenticated user's own generated
   * passages are excluded by the service.
   */
  @Get("passages")
  @UseGuards(OptionalAuthGuard)
  async listPassages(
    @Query("hskLevel") rawLevel: unknown,
    @Req() req: Request,
  ): Promise<{ data: PassageRecord[] }> {
    const hskLevel = rawLevel !== undefined ? Number(rawLevel) : undefined;
    const userId = req.userId;

    // Validate hskLevel if provided (verbatim Express controller).
    if (hskLevel !== undefined && (isNaN(hskLevel) || hskLevel < 1 || hskLevel > 6)) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to list passages",
      });
    }

    try {
      const passages = await this.readersService.listPassages(hskLevel, userId);
      return { data: passages };
    } catch (err) {
      logger.error("Failed to list passages", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to list passages",
      });
    }
  }

  /**
   * GET /v1/readers/passages/:id
   * Get a single passage with segmented result and HSK profile. optionalAuth
   * (F5) — a guest reads without a userId (no per-word known status).
   */
  @Get("passages/:id")
  @UseGuards(OptionalAuthGuard)
  async getPassage(@Req() req: Request): Promise<{ data: PassageResponseData }> {
    const id = String(req.params.id);
    const userId = req.userId;

    if (!id) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to get passage",
      });
    }

    try {
      const result = await this.readersService.getPassage(id, userId);
      return this.formatPassageResponse(result);
    } catch (err) {
      if (err instanceof PassageNotFoundError) {
        throw new NotFoundException({ code: "NOT_FOUND", message: "Failed to get passage" });
      }
      logger.error("Failed to get passage", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get passage",
      });
    }
  }

  /**
   * POST /v1/readers/passages/:id/audio
   * Get audio URLs for all sentences in a passage. Two-tier fallback: GCS →
   * on-demand TTS. optionalAuth (calibrated F5): user and guest share identical
   * audio access — a guest (no/bad token) NEVER 401s and gets cache-first free
   * reads (GCS cold-cache is the cost protector). Returns per-sentence source
   * status — never 5xx for audio infra failures. `@HttpCode(200)` mirrors the
   * Express `res.json(...)` (Nest's POST default is 201).
   */
  @Post("passages/:id/audio")
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  async getPassageAudio(@Req() req: Request): Promise<{ data: PassageAudioResponse }> {
    const id = String(req.params.id);

    if (!id) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to get passage audio",
      });
    }

    try {
      const result = await this.readersService.getPassageAudio(id);
      return { data: result };
    } catch (err) {
      if (err instanceof PassageNotFoundError) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          message: "Failed to get passage audio",
        });
      }
      logger.error("Failed to get passage audio", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to get passage audio",
      });
    }
  }

  /**
   * POST /v1/readers/generate
   * Generate a new passage on a given topic. Auth-only. Body: { topic }.
   * Rate limited to 5/day per user (DB-backed UTC midnight reset, enforced by
   * `ReadersService.checkRateLimits`). `@HttpCode(201)` mirrors the Express
   * `res.status(201).json(...)`.
   */
  @Post("generate")
  @HttpCode(201)
  @UseGuards(RequireAuthGuard)
  async generatePassage(
    @Body() body: { topic?: unknown },
    @Req() req: Request,
  ): Promise<{ data: PassageResponseData }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to generate passage",
      });
    }

    const { topic } = body ?? {};

    // Validate topic (verbatim Express controller).
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to generate passage",
      });
    }

    if (topic.length > 100) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to generate passage",
      });
    }

    try {
      const result = await this.readersService.generatePassage(topic.trim(), userId);
      return this.formatPassageResponse(result);
    } catch (err) {
      // 429 — DB-backed 5/day generation limit (or the 5-passage storage cap):
      // `ReadersService.checkRateLimits` throws RateLimitExceededError, mapped
      // by the Express controller to 429 RATE_LIMIT (verbatim here).
      if (err instanceof RateLimitExceededError) {
        throw new HttpException({ code: "RATE_LIMIT", message: "Failed to generate passage" }, 429);
      }
      // 502 — Gemini generation/parsing failure.
      if (err instanceof PassageGenerationError) {
        throw new BadGatewayException({
          code: "GENERATION_ERROR",
          message: "Failed to generate passage",
        });
      }
      logger.error("Failed to generate passage", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to generate passage",
      });
    }
  }

  // ── Reading Session Handlers ───────────────────────────────────────────

  /**
   * GET /v1/readers/sessions/:passageId
   * Get or create a reading session. Returns { currentSentence, isCompleted }.
   * requireAuth — user-scoped reading progress.
   */
  @Get("sessions/:passageId")
  @UseGuards(RequireAuthGuard)
  async getSession(
    @Req() req: Request,
  ): Promise<{ data: { currentSentence: number; isCompleted: boolean } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Failed to get session" });
    }
    const passageId = String(req.params.passageId);
    if (!passageId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to get session",
      });
    }

    try {
      const session = await this.readersService.getOrCreateSession(userId, passageId);
      return { data: session };
    } catch (err) {
      logger.error("Failed to get session", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to get session",
      });
    }
  }

  /**
   * PUT /v1/readers/sessions/:passageId
   * Update reading position. Body: { currentSentence: number }. requireAuth.
   */
  @Put("sessions/:passageId")
  @UseGuards(RequireAuthGuard)
  async updateSession(
    @Body() body: { currentSentence?: unknown },
    @Req() req: Request,
  ): Promise<{ data: { currentSentence: number; isCompleted: boolean } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to update session",
      });
    }
    const passageId = String(req.params.passageId);
    if (!passageId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to update session",
      });
    }

    const { currentSentence } = body ?? {};
    if (
      typeof currentSentence !== "number" ||
      !Number.isInteger(currentSentence) ||
      currentSentence < 0
    ) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to update session",
      });
    }

    try {
      const result = await this.readersService.updatePosition(userId, passageId, currentSentence);
      return { data: result };
    } catch (err) {
      logger.error("Failed to update session", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to update session",
      });
    }
  }

  /**
   * POST /v1/readers/sessions/:passageId/complete
   * Mark a passage as completed (idempotent). Returns { passageId }. requireAuth.
   * `@HttpCode(200)` mirrors the Express `res.json(...)`.
   */
  @Post("sessions/:passageId/complete")
  @HttpCode(200)
  @UseGuards(RequireAuthGuard)
  async completePassage(@Req() req: Request): Promise<{ data: { passageId: string } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to complete passage",
      });
    }
    const passageId = String(req.params.passageId);
    if (!passageId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to complete passage",
      });
    }

    try {
      const result = await this.readersService.markCompleted(userId, passageId);
      return { data: result };
    } catch (err) {
      logger.error("Failed to complete passage", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to complete passage",
      });
    }
  }

  // ── Bookmark Handlers ──────────────────────────────────────────────────

  /**
   * GET /v1/readers/bookmarks
   * List bookmarked passage IDs. Returns { bookmarks: string[] }. requireAuth.
   */
  @Get("bookmarks")
  @UseGuards(RequireAuthGuard)
  async listBookmarks(@Req() req: Request): Promise<{ data: { bookmarks: string[] } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to list bookmarks",
      });
    }

    try {
      const bookmarks = await this.readersService.listBookmarks(userId);
      return { data: { bookmarks } };
    } catch (err) {
      logger.error("Failed to list bookmarks", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to list bookmarks",
      });
    }
  }

  /**
   * POST /v1/readers/bookmarks
   * Add a bookmark. Body: { passageId }. Returns { passageId }. requireAuth.
   * `@HttpCode(201)` mirrors the Express `res.status(201).json(...)`.
   */
  @Post("bookmarks")
  @HttpCode(201)
  @UseGuards(RequireAuthGuard)
  async addBookmark(
    @Body() body: { passageId?: unknown },
    @Req() req: Request,
  ): Promise<{ data: { passageId: string } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to add bookmark",
      });
    }
    const { passageId } = body ?? {};
    if (!passageId || typeof passageId !== "string") {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to add bookmark",
      });
    }

    try {
      const result = await this.readersService.addBookmark(userId, passageId);
      return { data: result };
    } catch (err) {
      logger.error("Failed to add bookmark", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to add bookmark",
      });
    }
  }

  /**
   * DELETE /v1/readers/bookmarks/by-passage/:passageId
   * Remove a bookmark by passage ID (idempotent). requireAuth.
   * `@HttpCode(204)` + empty body mirrors the Express `res.status(204).send()`.
   */
  @Delete("bookmarks/by-passage/:passageId")
  @HttpCode(204)
  @UseGuards(RequireAuthGuard)
  async deleteBookmarkByPassage(@Req() req: Request): Promise<void> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to remove bookmark",
      });
    }
    const passageId = String(req.params.passageId);
    if (!passageId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to remove bookmark",
      });
    }

    try {
      await this.readersService.removeBookmarkByPassage(userId, passageId);
    } catch (err) {
      logger.error("Failed to remove bookmark", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to remove bookmark",
      });
    }
  }

  /**
   * GET /v1/readers/bookmarks/by-passage/:passageId
   * Check if a single passage is bookmarked. Returns { isBookmarked: boolean }.
   * requireAuth.
   */
  @Get("bookmarks/by-passage/:passageId")
  @UseGuards(RequireAuthGuard)
  async checkBookmarkByPassage(@Req() req: Request): Promise<{ data: { isBookmarked: boolean } }> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({
        code: "AUTH_ERROR",
        message: "Failed to check bookmark",
      });
    }
    const passageId = String(req.params.passageId);
    if (!passageId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Failed to check bookmark",
      });
    }

    try {
      const isBookmarked = await this.readersService.checkBookmarkByPassage(userId, passageId);
      return { data: { isBookmarked } };
    } catch (err) {
      logger.error("Failed to check bookmark", err);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to check bookmark",
      });
    }
  }
}
