/**
 * @file apps/backend/src/modules/quiz/nest/quiz.module.ts
 * @description NestJS `@Module` for the Quiz module (Story 24-13 — Quiz +
 * Progression Port).
 *
 * 1:1 translation of `createQuizModule(deps)` in `modules/quiz/container.ts`,
 * wiring the SAME framework-agnostic services through Nest providers:
 *
 *   - `QuizRepository` — self-imports the shared Prisma singleton (same as the
 *     Express path); provided via `useFactory`.
 *   - `QuizService` — constructor-injected with `QuizRepository` +
 *     `ProgressionService` (the same two deps the container factory takes).
 *     Delegates question generation / answer validation to the registered
 *     strategy via the `strategies/registry.ts` (reused unchanged — no strategy
 *     touched, so the backend engine shape is ported AS-IS; the known FE quiz
 *     engine bugs (`PHASE_CONFIGS[3]`, key-4 dup) are frontend-only and stay in
 *     epic-26 (C-declared) — nothing backend-detectable is canonized here).
 *   - `SandhiDrillService` — provided via `useFactory` and injected into the
 *     separate `SandhiDrillNestController` (1:1 with the Express
 *     `SandhiDrillController`, which news its own service).
 *
 * CIRCULAR-DI (24-13 ADR — FALLBACK = re-injection via a provider factory
 * step; `forwardRef`-direct was PRIMARY and failed the parity harness — see
 * `progression-quiz-bridge.ts` for the full ADR): `QuizService` →
 * `ProgressionService` → `QuizService` is broken by construction-order
 * decoupling. THIS module imports `forwardRef(() => ProgressionModule)` and
 * injects `forwardRef(() => ProgressionService)` into the `QuizService`
 * factory — safe because `ProgressionModule` builds `ProgressionService`
 * WITHOUT `QuizService` (no factory waits on this module), so the referenced
 * provider is always resolved when this factory runs. The REVERSE edge
 * (`ProgressionService` ← `QuizService`) is re-injected once by
 * `ProgressionQuizBridge.onModuleInit` (the mutable `setQuizService` setter is
 * called exactly once at composition, per the documented fallback).
 *
 * `SharedModule` is imported for `GeminiService` (the AI-feedback route,
 * `POST /v1/quiz/feedback`) + the shared infra providers (cache / gemini /
 * `WordRepository` available transitively — the quiz code itself self-imports
 * Prisma exactly like Express; only `GeminiService` is consumed directly).
 * `GuardsModule` is imported so the calibrated `OptionalAuthGuard` /
 * `RequireAuthGuard` (24-5) and their `JwtService` dependency resolve in this
 * module's context for the controllers' `@UseGuards(...)` decorators.
 *
 * The Express wiring (`container.ts`, `api/QuizController.ts`,
 * `api/SandhiDrillController.ts`, `api/quizRoutes.ts`, `api/aiFeedbackRoutes.ts`)
 * is UNTOUCHED — this module coexists as the Nest shell surface (dual-mode)
 * and is deleted at the module's cutover (24-15).
 */

import { Module, forwardRef } from "@nestjs/common";
import { QuizNestController } from "./quiz-nest.controller.js";
import { SandhiDrillNestController } from "./sandhi-drill-nest.controller.js";
import { QuizRepository } from "../repositories/QuizRepository.js";
import { QuizService } from "../services/QuizService.js";
import { SandhiDrillService } from "../strategies/SandhiDrillService.js";
// Value import required — `forwardRef(() => ProgressionService)` reads the
// class at callback time. No runtime cycle: ProgressionService imports QuizService
// as a type only, so the service module is side-effect-free.
import { ProgressionService } from "../../progression/services/ProgressionService.js";
import { SharedModule } from "../../../nest/shared/shared.module.js";
import { GuardsModule } from "../../../nest/guards/guards.module.js";
// Real (non-type) import required — `forwardRef(() => ProgressionModule)` reads
// the class at callback time. ESM hoisting makes the module-level circular
// import safe: the callback only evaluates after both modules are defined.
import { ProgressionModule } from "../../progression/nest/progression.module.js";

@Module({
  imports: [SharedModule, GuardsModule, forwardRef(() => ProgressionModule)],
  controllers: [QuizNestController, SandhiDrillNestController],
  providers: [
    { provide: QuizRepository, useFactory: () => new QuizRepository() },
    {
      provide: QuizService,
      // forwardRef in the inject array — the idiomatic Nest circular-DI
      // resolution (24-13 ADR): the factory receives the ProgressionService
      // instance once the cycle resolves. No `setQuizService` setter call.
      // `as never`: Nest's `Provider.inject` type doesn't include
      // ForwardReference, but `resolveParamToken` unwraps it at runtime.
      useFactory: (quizRepository: QuizRepository, progressionService: ProgressionService) =>
        new QuizService(quizRepository, progressionService),
      inject: [QuizRepository, forwardRef(() => ProgressionService) as never],
    },
    { provide: SandhiDrillService, useFactory: () => new SandhiDrillService() },
  ],
  exports: [QuizService],
})
export class QuizModule {}
