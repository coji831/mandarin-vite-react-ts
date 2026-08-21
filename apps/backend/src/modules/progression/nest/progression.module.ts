/**
 * @file apps/backend/src/modules/progression/nest/progression.module.ts
 * @description NestJS `@Module` for the Progression module (Story 24-13 — Quiz
 * + Progression Port).
 *
 * 1:1 translation of `createProgressionModule(deps)` in
 * `modules/progression/container.ts`, wiring the SAME framework-agnostic
 * services through Nest providers:
 *
 *   - `ProgressionRepository` — self-imports the shared Prisma singleton (same
 *     as the Express path); provided via `useFactory`.
 *   - `ProgressionService` — constructor-injected with `ProgressionRepository`
 *     + `ReadersService` (the SAME two deps the container factory passes at
 *     construction; the third, `QuizService`, is re-injected after boot — see
 *     the circular-DI ADR below).
 *
 * CIRCULAR-DI (24-13 ADR — FALLBACK = re-injection via a provider factory
 * step; `forwardRef`-direct was PRIMARY and failed the parity harness — see
 * `progression-quiz-bridge.ts` for the full ADR): `ProgressionService` needs
 * `QuizService` (`checkPhase3To4Gate` →
 * `quizService.getComprehensionQuizResult`) and `QuizService` needs
 * `ProgressionService` (`completeQuizAttempt` →
 * `progressionService.updatePhaseGate`). To avoid the forwardRef lazy-init
 * failure (whichever factory constructs first receives `undefined` for its
 * un-resolved `forwardRef` peer), the construction cycle is broken so NO
 * service factory waits on the other at construction:
 *   1. `ProgressionService` is built WITHOUT `quizService` (optional ctor
 *      param).
 *   2. `QuizService` (in `QuizModule`) gets `ProgressionService` — always
 *      available first — via `forwardRef`.
 *   3. `ProgressionQuizBridge.onModuleInit` re-injects `quizService` into the
 *      built `ProgressionService` via `ModuleRef.get` (guaranteed resolved).
 * The `setQuizService` setter is called exactly once at composition (boot), the
 * documented fallback per the 24-13 AC.
 *
 * Module deps (verbatim from the Express wiring): `ReviewModule` (the
 * `ReviewService` the controller uses for the radical-memorized ReviewItem
 * side-effect), `ReadersModule` (the `ReadersService` the service uses for the
 * Phase 3→4 gate), `QuizModule` (via `forwardRef`), `SharedModule` (the shared
 * infra — `GATE_THRESHOLDS` provider + Prisma/Redis; the `ProgressionService`
 * self-imports the same `src/config/gate-thresholds.ts` constants unchanged,
 * so zero drift), `GuardsModule` (calibrated `OptionalAuthGuard` /
 * `RequireAuthGuard` for the controller).
 *
 * The Express wiring (`container.ts`, `api/ProgressionController.ts`,
 * `api/progressionRoutes.ts`) is UNTOUCHED — this module coexists as the Nest
 * shell surface (dual-mode) and is deleted at the module's cutover (24-15).
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
