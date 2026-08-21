/**
 * @file apps/backend/src/modules/progression/nest/progression-nest.controller.ts
 * @description NestJS controller for the progression module (Story 24-13 — Quiz
 * + Progression Port). Mirrors `api/ProgressionController.ts` (Express) 1:1 —
 * same query/body/path parsing + string coercion, same service delegation,
 * same 2xx JSON, same 4xx/5xx `code`/`message` (the global 24-3
 * `AppExceptionFilter` serializes thrown `HttpException`s into the
 * `{ code, message, requestId }` envelope; `code`/`message` are byte-for-byte
 * equal to the Express controller's legacy `{ error, code }` body).
 *
 * Routes (verbatim from `api/progressionRoutes.ts` — ROUTE_PATTERNS):
 *   - `GET  /v1/progression/foundation-progress`        → optionalAuth
 *   - `PUT  /v1/progression/foundation-progress/:sectionId` → requireAuth
 *   - `GET  /v1/progression/phase-gate`                 → optionalAuth
 *   - `GET  /v1/progression/gates`                      → optionalAuth (CALIBRATED guest)
 *   - `PUT  /v1/progression/phase-gate`                 → requireAuth
 *   - `GET  /v1/progression/radical-progress`           → optionalAuth
 *   - `PUT  /v1/progression/radical-progress/:radicalId` → requireAuth
 *
 * Guard mapping (verbatim from `api/progressionRoutes.ts`): the read routes →
 * the CALIBRATED `OptionalAuthGuard` (24-5) — a guest proceeds with `req.userId`
 * UNDEFINED and the controller returns session-local/empty shapes (F6: never
 * another user's rows, never all-unlocked). The write routes (`foundation-
 * progress/:sectionId`, `phase-gate`, `radical-progress/:radicalId`) →
 * `RequireAuthGuard` (registered-only persistence).
 *
 * CALIBRATED `/gates` GUEST BRANCH (24-13 — the 24-7 deferred item): the
 * Express `getGates` guest branch returns the ALL-PASSED `GUEST` object (every
 * gate `passed: true`). The Nest port targets the CALIBRATED shape (24-5 F6 /
 * 24-7 identity): a guest is Phase-1-only, so the Phase 2 IME / character-count
 * / Phase 3→4 gates are NOT passed — `getGates` now AGREES with `getPhaseGate`
 * (`createGuestPhaseGate()` → `currentPhase: 1, isGuest: true`) for the same
 * guest identity. The Express controller is intentionally UNTOUCHED (dual-mode
 * until 24-15) — the parity harness asserts the calibrated shape on Nest
 * explicitly (a documented deviation from Express, per the F6 port target).
 *
 * The `if (!userId)` 401 `AUTH_ERROR`/empty branches on the user-scoped routes
 * are defense-in-depth mirroring the Express controller structure (unreachable
 * under `RequireAuthGuard`).
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { createLogger } from "../../../shared/utils/logger.js";
import { createGuestPhaseGate } from "@mandarin/shared-constants";
import { ProgressionService } from "../services/ProgressionService.js";
import { ReviewService } from "../../review/services/ReviewService.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";
import { RequireAuthGuard } from "../../../nest/guards/require-auth.guard.js";

const logger = createLogger("ProgressionNestController");

/**
 * NestJS controller for the progression module (Story 24-13).
 */
@Controller("v1/progression")
export class ProgressionNestController {
  constructor(
    @Inject(ProgressionService) private readonly progressionService: ProgressionService,
    @Inject(ReviewService) private readonly reviewService: ReviewService,
  ) {}

  /**
   * GET /v1/progression/foundation-progress
   * Fetch user's foundation section progress (auto-initializes 4 records if
   * none exist). optionalAuth — a guest gets `[]` (no tracking data).
   */
  @Get("foundation-progress")
  @UseGuards(OptionalAuthGuard)
  async getFoundationProgress(@Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — no tracking data
        return [];
      }
      const progress = await this.progressionService.getOrCreateFoundationProgress(userId);
      return progress;
    } catch (error) {
      logger.error("Error fetching foundation progress", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to fetch foundation progress",
      });
    }
  }

  /**
   * PUT /v1/progression/foundation-progress/:sectionId
   * Mark a foundation section as completed. requireAuth — progress persistence
   * requires a registered user.
   */
  @Put("foundation-progress/:sectionId")
  @UseGuards(RequireAuthGuard)
  async markSectionCompleted(
    @Param("sectionId") sectionIdParam: string,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — no-op
        return { sectionId: sectionIdParam, completed: false };
      }
      const sectionId = String(sectionIdParam);
      const progress = await this.progressionService.upsertFoundationProgress(
        userId,
        sectionId,
        true,
      );
      return progress;
    } catch (error) {
      if (error instanceof Error && error.message?.startsWith("Invalid sectionId")) {
        throw new BadRequestException({ code: "VALIDATION_ERROR", message: error.message });
      }
      logger.error("Error marking section completed", error);
      throw new InternalServerErrorException({
        code: "UPDATE_FAILED",
        message: "Failed to mark section completed",
      });
    }
  }

  /**
   * GET /v1/progression/phase-gate
   * Fetch user's phase gate status (auto-creates with defaults if none
   * exists). optionalAuth — a guest gets the calibrated
   * `createGuestPhaseGate()` (`currentPhase: 1, isGuest: true` — 24-7).
   */
  @Get("phase-gate")
  @UseGuards(OptionalAuthGuard)
  async getPhaseGate(@Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    if (!userId) {
      // Guest — calibrated Phase-1 gate (never all-unlocked).
      return createGuestPhaseGate();
    }
    try {
      const phaseGate = await this.progressionService.getOrCreatePhaseGate(userId);
      return phaseGate;
    } catch (error) {
      logger.error("Error fetching phase gate", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to fetch phase gate",
      });
    }
  }

  /**
   * GET /v1/progression/gates
   * Fetch COMPUTED gate statuses (Phase 2 IME, character count ≥500, Phase
   * 3→4 comprehension). optionalAuth — CALIBRATED guest branch (24-13): a guest
   * is Phase-1-only, so none of the Phase 2+ gates are passed — agreeing with
   * `getPhaseGate` for the same guest identity. NEVER the all-passed `GUEST`
   * shape the Express controller still returns (F6-inconsistent; Express is
   * unified at cutover, 24-15).
   */
  @Get("gates")
  @UseGuards(OptionalAuthGuard)
  async getGates(@Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Calibrated guest — Phase-1-only: the Phase 2+ gates are NOT passed
        // (unified with createGuestPhaseGate() → currentPhase: 1, isGuest: true).
        return {
          phase2Gate: { passed: false, reason: "GUEST", details: "Guest — Phase 1 only" },
          characterCountGate: { passed: false, reason: "GUEST", details: "Guest — Phase 1 only" },
          phase3To4Gate: { passed: false, reason: "GUEST", details: "Guest — Phase 1 only" },
        };
      }
      const gates = await this.progressionService.getGateStatus(userId);
      return gates;
    } catch (error) {
      logger.error("Error fetching gate status", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to load gate status",
      });
    }
  }

  /**
   * PUT /v1/progression/phase-gate
   * Update phase gate progression after a quiz attempt. requireAuth — phase
   * gating requires a registered user (guests never reach this handler).
   */
  @Put("phase-gate")
  @UseGuards(RequireAuthGuard)
  async updatePhaseGate(
    @Body() body: { phase?: number; passed?: boolean; gateCriteria?: string },
    @Req() req: Request,
  ): Promise<unknown> {
    try {
      const { phase, passed, gateCriteria } = body ?? {};
      // RequireAuthGuard guarantees req.userId — typed string (unreachable
      // undefined; mirror the Express `req.userId!`). The `as` mirrors the
      // Express any-typed `req.body` pass-through — the service treats
      // undefined phase/passed as falsy (same as Express).
      const userId = req.userId as string;
      const updated = await this.progressionService.updatePhaseGate(userId, {
        phase,
        passed,
        gateCriteria,
      } as { phase: number; passed: boolean; gateCriteria?: string });
      return updated;
    } catch (error) {
      logger.error("Error updating phase gate", error);
      throw new InternalServerErrorException({
        code: "UPDATE_FAILED",
        message: "Failed to update phase gate",
      });
    }
  }

  /**
   * GET /v1/progression/radical-progress
   * Fetch user's radical progress records. optionalAuth — a guest gets `[]`
   * (no tracking data).
   */
  @Get("radical-progress")
  @UseGuards(OptionalAuthGuard)
  async getRadicalProgress(@Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — no tracking data
        return [];
      }
      const progress = await this.progressionService.getRadicalProgress(userId);
      return progress;
    } catch (error) {
      logger.error("Error fetching radical progress", error);
      throw new InternalServerErrorException({
        code: "LOAD_FAILED",
        message: "Failed to load radical progress",
      });
    }
  }

  /**
   * PUT /v1/progression/radical-progress/:radicalId
   * Create or update radical progress. If memorized=true, triggers the
   * ReviewItem side-effect via ReviewService (fire-and-forget, controller-level
   * orchestration — verbatim the Express controller). requireAuth — progress
   * persistence requires a registered user.
   */
  @Put("radical-progress/:radicalId")
  @UseGuards(RequireAuthGuard)
  async upsertRadicalProgress(
    @Param("radicalId") radicalIdParam: string,
    @Body() body: { memorized?: boolean; recognitionLevel?: number },
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — no-op
        return {
          radicalId: radicalIdParam,
          memorized: body.memorized ?? false,
          recognitionLevel: body.recognitionLevel ?? 0,
        };
      }
      const radicalId = String(radicalIdParam);
      const { memorized, recognitionLevel } = body ?? {};

      const progress = await this.progressionService.upsertRadicalProgress(userId, radicalId, {
        memorized: memorized ?? false,
        recognitionLevel: recognitionLevel ?? 0,
      });

      // Side-effect: if memorized, create a ReviewItem via ReviewService
      // (fire-and-forget)
      if (memorized && this.reviewService) {
        this.reviewService
          .recordRating(userId, {
            itemType: "radical",
            itemId: radicalId,
            rating: "good",
          })
          .catch((err: Error) => {
            logger.warn("Failed to create ReviewItem for radical", err);
          });
      }

      return progress;
    } catch (error) {
      if (error instanceof Error && error.message?.startsWith("Invalid radicalId")) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          message: "Failed to update radical progress",
        });
      }
      logger.error("Error upserting radical progress", error);
      throw new InternalServerErrorException({
        code: "UPDATE_FAILED",
        message: "Failed to update radical progress",
      });
    }
  }
}
