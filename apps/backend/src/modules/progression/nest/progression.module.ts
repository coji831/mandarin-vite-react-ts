/**
 * @file apps/backend/src/modules/progression/nest/progression.module.ts
 * @description NestJS `@Module` for the Progression module (Story 24-13 — Quiz
 * + Progression Port).
 *
 * Wires `ProgressionService` (constructor-injected with `ProgressionRepository`
 * + `ReadersService`) + `ProgressionQuizBridge`, and exports the service.
 * Module deps: `ReviewModule` (`ReviewService` — radical-memorized
 * side-effect), `ReadersModule` (`ReadersService` — Phase 3→4 gate),
 * `forwardRef(() => QuizModule)`, `SharedModule` (`GATE_THRESHOLDS` +
 * Prisma/Redis), `GuardsModule` (calibrated guards).
 *
 * CIRCULAR-DI (24-13 ADR): `ProgressionService` is built WITHOUT `QuizService`
 * (optional ctor param) so no factory waits on the other; `QuizModule` gets
 * `ProgressionService` via `forwardRef`, and `ProgressionQuizBridge.onModuleInit`
 * re-injects `quizService` via `ModuleRef.get` — `setQuizService` runs exactly
 * once at boot.
 */

import { Module, forwardRef } from "@nestjs/common";
import { ProgressionNestController } from "./progression-nest.controller.js";
import { ProgressionQuizBridge } from "./progression-quiz-bridge.js";
import { ProgressionRepository } from "../repositories/ProgressionRepository.js";
import { ProgressionService } from "../services/ProgressionService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
import { ReviewModule } from "../../review/nest/review.module.js";
import { ReadersModule } from "../../readers/nest/readers.module.js";
import { ReadersService } from "../../readers/services/ReadersService.js";
// Real (non-type) import required — `forwardRef(() => QuizModule)` reads the
// class at callback time. ESM hoisting makes the module-level circular import
// safe: the callback only evaluates after both modules are defined.
import { QuizModule } from "../../quiz/nest/quiz.module.js";

@Module({
  imports: [SharedModule, GuardsModule, ReviewModule, ReadersModule, forwardRef(() => QuizModule)],
  controllers: [ProgressionNestController],
  providers: [
    { provide: ProgressionRepository, useFactory: () => new ProgressionRepository() },
    {
      provide: ProgressionService,
      // Constructed WITHOUT quizService — breaks the construction cycle (no
      // factory waits on QuizService). QuizService is re-injected by
      // `ProgressionQuizBridge.onModuleInit` (24-13 ADR fallback).
      useFactory: (progressionRepository: ProgressionRepository, readersService: ReadersService) =>
        new ProgressionService(progressionRepository, readersService),
      inject: [ProgressionRepository, ReadersService],
    },
    ProgressionQuizBridge,
  ],
  exports: [ProgressionService],
})
export class ProgressionModule {}
