/**
 * @file apps/backend/src/modules/review/nest/review-nest.controller.ts
 * @description NestJS controller for the review module (Story 24-11 — Review
 * Port + SRS Schema). Mirrors `api/ReviewController.ts` (Express) 1:1 — same
 * query/body parsing + string coercion, same service delegation, same 2xx JSON,
 * same 4xx `code`/`message` (the global 24-3 `AppExceptionFilter` serializes
 * thrown `HttpException`s into the `{ code, message, requestId }` envelope;
 * `code`/`message` are byte-for-byte equal to the Express controller's legacy
 * `{ error, code }` body).
 *
 * Routes (verbatim from `api/reviewRoutes.ts` — ROUTE_PATTERNS):
 *   - `GET  /v1/review/items`     → `@Get("items")`
 *   - `GET  /v1/review/due-count` → `@Get("due-count")`
 *   - `POST /v1/review/result`    → `@Post("result")`
 *
 * Guard mapping (verbatim from `api/reviewRoutes.ts`): all three routes →
 * `@UseGuards(RequireAuthGuard)` — the calibrated guest-rejecting guard (24-5).
 * Review is user-scoped SRS state + a write surface (S11/P11: guests never
 * reach endpoints that persist their state), so a guest is rejected 401
 * (AUTH_REQUIRED) before the controller — matching Express `requireAuth`.
 *
 * Structural P0-1 fix (Story 24-11 — defense-in-depth beyond the 24-1
 * stopgap): the `RequireAuthGuard` guarantees `req.userId` is present before
 * the controller runs, so it is TYPED `string` here (the guard is the
 * type/guard-level rejection of `undefined` — `undefined` cannot reach the
 * repository through a Nest route). The `if (!userId)` 401 check is kept as
 * defense-in-depth to mirror the Express controller structure (unreachable
 * under the guard). The repository ALSO structurally rejects `undefined`
 * userId (shared 24-1 check) — the Nest path never leaks.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { ReviewService } from "../services/ReviewService.js";
import type { RatingInput } from "../types/review.js";
import { RequireAuthGuard } from "../../../nest/guards/require-auth.guard.js";

const logger = createLogger("ReviewNestController");

/**
 * NestJS controller for the review module (Story 24-11).
 */
@Controller("v1/review")
export class ReviewNestController {
  constructor(@Inject(ReviewService) private readonly reviewService: ReviewService) {}

  /**
   * GET /v1/review/items
   * Fetch review items for the authenticated user (source "due"/"recent"/"all",
   * optional type prefix + limit). requireAuth — user-scoped SRS reads.
   */
  @Get("items")
  @UseGuards(RequireAuthGuard)
  async getReviewItems(
    @Query("source") sourceQuery: unknown,
    @Query("type") typeQuery: unknown,
    @Query("limit") limitQuery: unknown,
    @Req() req: Request,
  ): Promise<unknown> {
    // Structural P0-1 (24-11): RequireAuthGuard guarantees req.userId — typed
    // string. The 401 below is defense-in-depth mirroring the Express
    // controller (unreachable under the guard).
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Authentication required" });
    }

    const source = typeof sourceQuery === "string" ? sourceQuery : undefined;
    const type = typeof typeQuery === "string" ? typeQuery : undefined;
    const limit = typeof limitQuery === "string" ? limitQuery : undefined;

    try {
      const items = await this.reviewService.getReviewItems(userId, {
        source: source || "due",
        type: type || "",
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return items;
    } catch (error) {
      logger.error("Error fetching review items", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to fetch review items",
      });
    }
  }

  /**
   * POST /v1/review/result
   * Record a rating (again/good/easy) for a review item and compute the next
   * review date. requireAuth — writes user-scoped SRS state.
   */
  @Post("result")
  @HttpCode(200) // Express `res.status(200).json(result)` — Nest's default POST status is 201
  @UseGuards(RequireAuthGuard)
  async recordRating(
    @Body() body: { itemType?: string; itemId?: string; rating?: string },
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Authentication required" });
    }

    const { itemType, itemId, rating } = body ?? {};

    try {
      // The service validates itemType/itemId/rating at runtime (400
      // MISSING_FIELDS); mirror the Express controller's any-typed `req.body`
      // pass-through exactly.
      const result = await this.reviewService.recordRating(userId, {
        itemType,
        itemId,
        rating,
      } as RatingInput);
      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message?.startsWith("itemType") || error.message?.startsWith("rating must be"))
      ) {
        throw new BadRequestException({ code: "MISSING_FIELDS", message: error.message });
      }
      logger.error("Error recording rating", error);
      throw new InternalServerErrorException({
        code: "UPDATE_FAILED",
        message: "Failed to record rating",
      });
    }
  }

  /**
   * GET /v1/review/due-count
   * Count the authenticated user's due SRS rows (optional type prefix).
   * requireAuth — user-scoped SRS count.
   */
  @Get("due-count")
  @UseGuards(RequireAuthGuard)
  async getDueCount(@Query("type") typeQuery: unknown, @Req() req: Request): Promise<unknown> {
    const userId = req.userId as string;
    if (!userId) {
      throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Authentication required" });
    }

    const type = typeof typeQuery === "string" ? typeQuery : undefined;

    try {
      const count = await this.reviewService.getDueCount(userId, type || "");
      return { count };
    } catch (error) {
      logger.error("Error fetching due count", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to fetch due count",
      });
    }
  }
}
