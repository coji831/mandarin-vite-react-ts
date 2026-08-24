/**
 * @file apps/backend/src/modules/progression/nest/progression-quiz-bridge.ts
 * @description Re-injection bridge for the `progression ↔ quiz` circular-DI
 * (Story 24-13).
 *
 * ADR (24-13): `forwardRef` was the PRIMARY approach (`@Module({ imports:
 * [forwardRef(() => QuizModule)] })` + `forwardRef` inject tokens on BOTH
 * service factories). The parity harness — the arbiter — caught a lazy-init
 * failure: with two `useFactory` providers that each `forwardRef` the other in
 * a true cycle, Nest's `resolveParamToken` unwraps the `forwardRef` and, if
 * the referenced provider is not yet instantiated, marks the wrapper
 * `forwardRef: true` and returns `undefined` (the injector does NOT load an
 * un-resolved forward-referenced wrapper in the static context). Whichever
 * service constructs first therefore received `undefined` for its peer →
 * `ProgressionService.checkPhase3To4Gate` returned `DEPENDENCY_MISSING`
 * (parity failure).
 *
 * FALLBACK (chosen, documented): break the construction cycle so NO service
 * factory needs the other at construction time, then re-inject via a provider
 * factory step:
 *   1. `ProgressionService` is constructed WITHOUT `quizService` (the ctor
 *      param is optional and `setQuizService` is the documented re-injection
 *      seam).
 *   2. `QuizService` is constructed WITH `ProgressionService` — which is
 *      ALWAYS available first (it needs no `QuizService`), so the `forwardRef`
 *      resolves to a real instance.
 *   3. THIS bridge re-injects `quizService` into the already-constructed
 *      `ProgressionService` in `onModuleInit`. Nest guarantees
 *      `registerModules()` instantiates EVERY module's providers before
 *      `callInitHook()` runs any `onModuleInit`, so `ModuleRef.get(QuizService)`
 *      here is guaranteed resolved — no ordering race.
 *
 * The mutable `setQuizService` setter is invoked EXACTLY ONCE at composition
 * time (boot) — never as a per-request escape hatch. This is the documented
 * fallback per the 24-13 AC ("no mutable setter in Nest land UNLESS documented
 * fallback").
 */

import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ProgressionService } from "../services/ProgressionService.js";
import { QuizService } from "../../quiz/services/QuizService.js";

@Injectable()
export class ProgressionQuizBridge implements OnModuleInit {
  constructor(
    @Inject(ProgressionService) private readonly progressionService: ProgressionService,
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit(): void {
    // All providers are instantiated by now (registerModules runs before
    // callInitHook) — QuizService is guaranteed resolved.
    const quizService = this.moduleRef.get<QuizService>(QuizService, { strict: false });
    this.progressionService.setQuizService(quizService);
  }
}
