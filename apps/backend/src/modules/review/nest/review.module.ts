/**
 * @file apps/backend/src/modules/review/nest/review.module.ts
 * @description NestJS `@Module` for the Review module (Story 24-11 — Review
 * Port + SRS Schema).
 *
 * Wires `ReviewService` (constructor-injected with `ReviewRepository`, which
 * reads/writes the absorbed additive `SrsCardState` table) via a `useFactory`
 * provider and exports it. `GuardsModule` is imported so the calibrated
 * `RequireAuthGuard` and its `JwtService` dependency resolve in this module's
 * context. `SharedModule` is NOT imported — the service/repository self-import
 * the shared Prisma singleton (no external/cache/gemini deps).
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
