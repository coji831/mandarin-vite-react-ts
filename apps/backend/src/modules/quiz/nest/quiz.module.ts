/**
 * @file apps/backend/src/modules/quiz/nest/quiz.module.ts
 * @description NestJS `@Module` for the Quiz module (Story 24-13 — Quiz +
 * Progression Port).
 *
 * Wires `QuizService` (constructor-injected with `QuizRepository` +
 * `ProgressionService`) and `SandhiDrillService` (own controller) via
 * `useFactory` providers. `SharedModule` supplies `GeminiService` (AI-feedback
 * route); `GuardsModule` the calibrated `OptionalAuthGuard`/`RequireAuthGuard`.
 *
 * CIRCULAR-DI (24-13 ADR): `ProgressionService` is built WITHOUT `QuizService`
 * and re-injected once by `ProgressionQuizBridge.onModuleInit`; this module
 * uses `forwardRef(() => ProgressionModule)` + a `forwardRef`-inject into the
 * `QuizService` factory (the referenced provider is always resolved first).
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
