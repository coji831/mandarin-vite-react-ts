/**
 * @file apps/backend/src/modules/review/nest/review.module.ts
 * @description NestJS `@Module` for the Review module (Story 24-11 — Review
 * Port + SRS Schema).
 *
 * 1:1 translation of `createReviewModule(deps)` in `modules/review/container.ts`,
 * wiring the same framework-agnostic service through Nest providers:
 *
 *   - `ReviewRepository` — self-imports the shared Prisma singleton (same as
 *     the Express path); provided via `useFactory`. Reads/writes the absorbed
 *     additive `SrsCardState` table (24-11 re-point; `ReviewItem` untouched).
 *   - `ReviewService` — constructor-injected with `ReviewRepository` (the same
 *     dep the container factory takes). Interval-doubling semantics preserved
 *     (FSRS scheduling is epic-34).
 *
 * `GuardsModule` is imported so the calibrated `RequireAuthGuard` (24-5) and
 * its `JwtService` dependency resolve in this module's context for the
 * controller's `@UseGuards(...)` decorators. `SharedModule` is NOT imported —
 * `ReviewService`/`ReviewRepository` self-import the shared Prisma singleton
 * like the characters/radicals ports (no external/cache/gemini deps).
 *
 * The Express wiring (`container.ts`, `api/ReviewController.ts`,
 * `api/reviewRoutes.ts`) is UNTOUCHED — this module coexists as the Nest shell
 * surface (dual-mode) and is deleted at the module's cutover (24-15).
 */

import { Module } from "@nestjs/common";
import { ReviewNestController } from "./review-nest.controller.js";
import { ReviewRepository } from "../repositories/ReviewRepository.js";
import { ReviewService } from "../services/ReviewService.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";

@Module({
  imports: [GuardsModule],
  controllers: [ReviewNestController],
  providers: [
    { provide: ReviewRepository, useFactory: () => new ReviewRepository() },
    {
      provide: ReviewService,
      useFactory: (repository: ReviewRepository) => new ReviewService(repository),
      inject: [ReviewRepository],
    },
  ],
  exports: [ReviewService],
})
export class ReviewModule {}
