**Last Updated:** August 21, 2026

# Implementation 24-13: Quiz + Progression Port (Circular-DI Resolution)

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-13-quiz-progression-circular-di.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `e68e668a`

## Implementation Summary

Ported the `quiz` module (**8 routes** — 7 on `QuizNestController` + the sandhi-drill route on `SandhiDrillNestController`, with the **5-strategy registry** + `SandhiDrillService`) and the `progression` module (**7 routes**) from Express to the NestJS 11 shell under `modules/quiz/nest/` + `modules/progression/nest/`, resolving the **`progression ↔ quiz` circular dependency** with a recorded ADR and porting the backend engine **correctly** (no backend bug canonized). The guest quiz **submit** surface gets the calibrated `OptionalAuthGuard` (session-local mock shapes, no persistence — F6), `GET /v1/quiz/attempts` + `POST /v1/quiz/feedback` stay `RequireAuthGuard`, and the progression **`/gates` guest branch is CALIBRATED** to Phase-1-only (the 24-7 deferred item) — a documented deviation from the Express all-passed `GUEST` shape (unified at 24-15). **FE quiz-engine fixes stay in epic-26 (C-declared).**

**CIRCULAR-DI RESOLUTION (24-13 ADR — IMPORTANT).** `forwardRef`-direct was **PRIMARY** and **FAILED the parity harness**: `QuizService` → `ProgressionService` (`completeQuizAttempt` → `updatePhaseGate`) and `ProgressionService` → `QuizService` (`checkPhase3To4Gate` → `getComprehensionQuizResult`) form a true cycle; with two `useFactory` providers each `forwardRef`-ing the other, Nest's **`resolveParamToken` returns `undefined` for an un-instantiated `forwardRef` wrapper** (the injector does NOT load an un-resolved forward-referenced wrapper in the static context) — so whichever factory constructed first received `undefined` for its peer → `ProgressionService.checkPhase3To4Gate` returned **`DEPENDENCY_MISSING`** (parity failure). **Fallback as-built (re-injection bridge):**
  1. `ProgressionModule` builds `ProgressionService` **WITHOUT `quizService`** (optional ctor param — the same optionality + `setQuizService` seam the Express `app/container.ts` uses).
  2. `QuizModule` builds `QuizService` **WITH `forwardRef(() => ProgressionService)`** — `ProgressionService` is ALWAYS resolved first (needs no `QuizService`), so the `forwardRef` resolves to a real instance.
  3. **`ProgressionQuizBridge.onModuleInit`** re-injects `quizService` into the built `ProgressionService` via `ModuleRef.get(QuizService, { strict: false })` + `setQuizService()` — called **EXACTLY ONCE at composition** (Nest instantiates every module's providers before `callInitHook` runs any `onModuleInit`, so no ordering race). Module-level `forwardRef` kept on both sides (`ProgressionModule` ↔ `QuizModule`) for the DI graph. Full ADR documented in `progression-quiz-bridge.ts` + both module docstrings.

**Quiz (8 routes).** `QuizModule` (`imports: [SharedModule, GuardsModule, forwardRef(() => ProgressionModule)]`, controllers `QuizNestController` + `SandhiDrillNestController`, `exports: [QuizService]`): `QuizRepository` via `useFactory`, `QuizService` via `useFactory(quizRepository, progressionService)` with `inject: [QuizRepository, forwardRef(() => ProgressionService) as never]`, `SandhiDrillService` via `useFactory`. `QuizNestController` mirrors `api/QuizController.ts` + `api/aiFeedbackRoutes.ts` 1:1 — **7 routes verbatim** (`GET config`, `GET questions`, `POST attempts` `@HttpCode(201)`, `POST attempts/:id/answers` `@HttpCode(200)`, `PUT attempts/:id/complete`, `GET attempts`, `POST feedback` `@HttpCode(200)`); the guest submit surface (`config`/`questions`/`attempts` POST/`answers`/`complete`) → calibrated `OptionalAuthGuard` (guest → **session-local mock shapes** — mock attempt, locally-computed mock answer via `normalizePinyinForComparison`/`areTonesEquivalent`, mock completion `{ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 }`); `GET attempts` + `POST feedback` → `RequireAuthGuard`; the AI-feedback handler (`buildFeedbackPrompt` byte-for-byte + `GeminiService.generateText` `{ timeout: 5000 }` → `{ explanation, errorType: "ai_feedback" }`). `SandhiDrillNestController` (`GET /v1/quiz/sandhi-drill/questions`, `OptionalAuthGuard`) mirrors `api/SandhiDrillController.ts` — `count<1`/non-numeric → 400 `VALIDATION_ERROR`; `SandhiDrillService.generateQuestions` reuses the **5–25 clamp** (`Math.max(5, Math.min(25, count))`). **Backend shape ported correctly** — `strategies/registry.ts` (all 5 strategies: `audio-to-pinyin-tone`, `ime-simulator`, `radical-gate`, `comprehension`, `qualification`) + `SandhiDrillService` reused unchanged (no backend bug canonized; FE bugs `PHASE_CONFIGS[3]`/key-4 dup/`useQuizCard`/`QuizCard` are frontend-only, stay in 26).

**Progression (7 routes).** `ProgressionModule` (`imports: [SharedModule, GuardsModule, ReviewModule, ReadersModule, forwardRef(() => QuizModule)]`, controller `ProgressionNestController`, `exports: [ProgressionService]`): `ProgressionRepository` via `useFactory`; `ProgressionService` via `useFactory(progressionRepository, readersService)` — **WITHOUT `quizService`** (re-injected by the bridge); `ProgressionQuizBridge` as a provider. `ProgressionNestController` mirrors `api/ProgressionController.ts` 1:1 — **7 routes verbatim** (`GET/PUT foundation-progress(/…/:sectionId)`, `GET/PUT phase-gate`, `GET gates`, `GET/PUT radical-progress(/…/:radicalId)`); read routes → `OptionalAuthGuard` (guest → `[]` / calibrated `createGuestPhaseGate()` / **Phase-1-only gates**), write routes → `RequireAuthGuard`; `PUT radical-progress/:radicalId` keeps the `ReviewService.recordRating` fire-and-forget side-effect when `memorized` (controller-level orchestration, verbatim Express); `Invalid sectionId`/`Invalid radicalId` → 400 `VALIDATION_ERROR`. **`/gates` guest branch CALIBRATED (24-13 — the 24-7 deferred item):** the Nest `getGates` guest branch returns the **Phase-1-only** shape (`phase2Gate`/`characterCountGate`/`phase3To4Gate` all `{ passed: false, reason: "GUEST", details: "Guest — Phase 1 only" }`), agreeing with `createGuestPhaseGate()` — **NOT** the Express all-passed `GUEST` object (left untouched; unified at 24-15); the parity harness asserts the calibrated shape on Nest explicitly (documented Express deviation). Uses **`GATE_THRESHOLDS`** (SharedModule infra) + **`ReviewModule`** (`ReviewService` radical side-effect) + **`ReadersModule`** (`ReadersService` Phase 3→4 gate) + **`QuizModule`** (`QuizService` via the bridge).

**Quiz AI-feedback rate-limit (10/min/IP).** `QUIZ_FEEDBACK_LIMITER_CONFIG` (`windowMs: 60 * 1000`, `max: 10`, message `{ error: "Too many feedback requests.", code: "RATE_LIMIT" }`) declared in `rate-limit.config.ts` + `rateLimitQuizFeedback` mounted path-scoped on `/api/v1/quiz/feedback` in `configure-app.ts` — **1:1 with the inline `feedbackLimiter` in `api/aiFeedbackRoutes.ts`** (default IP key + `{ error, code }` body).

**Parity harness (28 tests).** `tests/integration/nest/quiz-progression-parity.test.ts` (DB-gated, boots real Express + real Nest in-process; `GeminiService` module-mocked so feedback is deterministic): quiz 2xx deep-equal with the **quiz question `id`/`category` shuffle-position normalization** (the `id` — `q-${index+1}` — is post-shuffle position and differs between apps → **sentinel `id: "QID"` + `category: "CAT"`**, sort by unique `audioKey`; sandhi sort-by-id/options-sorted; guest mock UUID/now → sentinels), 4xx/5xx `{ code, message, requestId }` envelope deep-equal (400 `VALIDATION_ERROR`, 401 `AUTH_REQUIRED`, 500), **guest vs registered** parity, **authed shared-attempt parity** (a shared attempt created via Express, submitted once, completed on both apps → deep-equal result; `GET /attempts` sorted by `id`), progression create paths run sequentially (P2002-race-free), and the **calibrated `/gates` guest shape** asserted explicitly on Nest (with the documented Express all-passed deviation). Unique TEST-NET-3 `X-Forwarded-For` IPs so the feedback/auth limiters never trip.

**Verification (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ **744 tests (was 704; +40** — the 3 new unit suites: quiz-nest 18 + sandhi-drill 5 + progression-nest 17) · `test:integration` ✅ **259 tests (was 231; +28** — the quiz+progression parity harness) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (no circular-DI runtime errors at boot — the bridge re-injects cleanly; `/api/v1/progression/gates` guest = calibrated Phase-1-only; `/api/v1/quiz/attempts` guest → 401 `AUTH_REQUIRED`).

## Technical Scope

Port the `quiz` module (8 routes incl. the 5-strategy registry + `SandhiDrillService`) and the `progression` module (7 routes) to the NestJS 11 shell with contract-identical behavior AND the circular-DI resolution (the `forwardRef`-primary → re-injection-bridge fallback ADR) + the calibrated `/gates` guest branch + the calibrated guest quiz-submit surface: a `QuizModule` (imports `SharedModule` + `GuardsModule` + `forwardRef(() => ProgressionModule)`; `QuizRepository`/`QuizService`/`SandhiDrillService` providers; exports `QuizService`) with a verbatim `QuizNestController` (7 routes, calibrated `OptionalAuthGuard` on the guest submit surface + `RequireAuthGuard` on attempts GET/feedback, `@HttpCode(201/200)` parity, every `{error, code}` branch → `HttpException` → 24-3 envelope) + `SandhiDrillNestController` (1 route, 5–25 clamp preserved); a `ProgressionModule` (imports `SharedModule` + `GuardsModule` + `ReviewModule` + `ReadersModule` + `forwardRef(() => QuizModule)`; `ProgressionService` built without `quizService`; `ProgressionQuizBridge` re-injects it once in `onModuleInit`) with a verbatim `ProgressionNestController` (7 routes, calibrated `/gates` guest branch); the quiz AI-feedback limiter in `rate-limit.config.ts` + path-scoped mount in `configure-app.ts`; `app.module.ts` registration; plus three unit suites (40 tests) and a dedicated DB-backed parity harness (28 tests). The Express quiz/progression wiring is untouched.

**Files:**

- `apps/backend/src/modules/quiz/nest/quiz.module.ts` — **NEW**: `QuizModule` — imports `SharedModule` + `GuardsModule` + `forwardRef(() => ProgressionModule)`; providers `QuizRepository` (useFactory), `QuizService` (useFactory with `inject: [QuizRepository, forwardRef(() => ProgressionService) as never]`), `SandhiDrillService` (useFactory); controllers `QuizNestController` + `SandhiDrillNestController`; `exports: [QuizService]`.
- `apps/backend/src/modules/quiz/nest/quiz-nest.controller.ts` — **NEW**: `QuizNestController` (`@Controller("v1/quiz")`) — **7 routes verbatim** (`GET config`, `GET questions`, `POST attempts` @`HttpCode(201)` OptionalAuth, `POST attempts/:id/answers` @`HttpCode(200)` OptionalAuth, `PUT attempts/:id/complete` OptionalAuth, `GET attempts` RequireAuth, `POST feedback` @`HttpCode(200)` RequireAuth); guest session-local mock shapes; `buildFeedbackPrompt` byte-for-byte + `GeminiService.generateText`; every `{error, code}` branch → `HttpException` → 24-3 envelope.
- `apps/backend/src/modules/quiz/nest/sandhi-drill-nest.controller.ts` — **NEW**: `SandhiDrillNestController` (`@Controller("v1/quiz")`) — `GET sandhi-drill/questions` (OptionalAuth); `count<1`/non-numeric → 400 `VALIDATION_ERROR`; 5–25 clamp preserved in `SandhiDrillService`.
- `apps/backend/src/modules/quiz/nest/__tests__/quiz-nest.controller.test.ts` — **NEW**: unit tests (**18**) — mocked `QuizService` + `GeminiService`; per-route success/guest-mock/error mapping (500 `INTERNAL_ERROR`/`LOAD_ERROR`/`VALIDATION_ERROR`, 400 `VALIDATION_ERROR`), guest mock attempt/answer/completion shapes, defaults (type/count/phase), feedback validation (no Gemini call on missing fields).
- `apps/backend/src/modules/quiz/nest/__tests__/sandhi-drill-nest-controller.test.ts` — **NEW**: unit tests (**5**) — delegated count, default 10, `count<1`/non-numeric → 400, service error → 500 `LOAD_ERROR`.
- `apps/backend/src/modules/progression/nest/progression.module.ts` — **NEW**: `ProgressionModule` — imports `SharedModule` + `GuardsModule` + `ReviewModule` + `ReadersModule` + `forwardRef(() => QuizModule)`; `ProgressionRepository` (useFactory), `ProgressionService` (useFactory `(progressionRepository, readersService)` — **without `quizService`**), `ProgressionQuizBridge`; exports `ProgressionService`.
- `apps/backend/src/modules/progression/nest/progression-nest.controller.ts` — **NEW**: `ProgressionNestController` (`@Controller("v1/progression")`) — **7 routes verbatim** (GET/PUT foundation-progress(/…/:sectionId), GET/PUT phase-gate, GET gates, GET/PUT radical-progress(/…/:radicalId)); calibrated `/gates` guest branch (Phase-1-only); `ReviewService.recordRating` fire-and-forget on memorized; `Invalid sectionId`/`Invalid radicalId` → 400 `VALIDATION_ERROR`; every `{error, code}` branch → `HttpException` → 24-3 envelope.
- `apps/backend/src/modules/progression/nest/progression-quiz-bridge.ts` — **NEW**: `ProgressionQuizBridge implements OnModuleInit` — re-injects `quizService` via `ModuleRef.get(QuizService, { strict: false })` + `setQuizService()`, called exactly once at composition; full **24-13 ADR** (`forwardRef`-direct failure → re-injection bridge) documented here.
- `apps/backend/src/modules/progression/nest/__tests__/progression-nest.controller.test.ts` — **NEW**: unit tests (**17**) — mocked `ProgressionService` + `ReviewService`; per-route success/guest/error mapping (500 `LOAD_FAILED`/`UPDATE_FAILED`, 400 `VALIDATION_ERROR`), calibrated guest `phase-gate` (`createGuestPhaseGate`) + `/gates` (Phase-1-only) branches, `ReviewItem` side-effect (memorized true/false).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: register `QuizModule` + `ProgressionModule` (paths `/v1/quiz/*` + `/v1/progression/*` share no prefix with any other module).
- `apps/backend/src/nest/rate-limit.config.ts` — **UPDATE**: `QUIZ_FEEDBACK_LIMITER_CONFIG` (10/min/IP) + `rateLimitQuizFeedback` — 1:1 with the inline `feedbackLimiter` in `aiFeedbackRoutes.ts`.
- `apps/backend/src/nest/configure-app.ts` — **UPDATE**: mount `expressApp.use("/api/v1/quiz/feedback", rateLimitQuizFeedback)` (path-scoped, guards only the feedback route).
- `apps/backend/tests/integration/nest/quiz-progression-parity.test.ts` — **NEW**: DB-gated parity harness (**28 tests**) — boots the real Express app + real Nest `AppModule`; `GeminiService` module-mocked; real users registered via Express `/auth/register`; quiz `id`/`category` shuffle-position normalization (sentinels `QID`/`CAT`); unique TEST-NET-3 `X-Forwarded-For` IPs.

## Implementation Details

### The circular-DI resolution — `forwardRef`-direct failed; the re-injection bridge shipped

```typescript
// apps/backend/src/modules/progression/nest/progression.module.ts
@Module({
  imports: [SharedModule, GuardsModule, ReviewModule, ReadersModule, forwardRef(() => QuizModule)],
  controllers: [ProgressionNestController],
  providers: [
    { provide: ProgressionRepository, useFactory: () => new ProgressionRepository() },
    {
      provide: ProgressionService,
      // Constructed WITHOUT quizService — breaks the construction cycle (no
      // factory waits on QuizService). QuizService is re-injected by
      // ProgressionQuizBridge.onModuleInit (24-13 ADR fallback).
      useFactory: (progressionRepository: ProgressionRepository, readersService: ReadersService) =>
        new ProgressionService(progressionRepository, readersService),
      inject: [ProgressionRepository, ReadersService],
    },
    ProgressionQuizBridge,
  ],
  exports: [ProgressionService],
})
export class ProgressionModule {}
```

```typescript
// apps/backend/src/modules/progression/nest/progression-quiz-bridge.ts (the ADR + the bridge)
// ADR (24-13): forwardRef was PRIMARY and failed the parity harness — with two
// useFactory providers each forwardRef-ing the other in a true cycle, Nest's
// resolveParamToken unwraps the forwardRef and, if the referenced provider is
// not yet instantiated, returns undefined for the peer → whichever service
// constructed first got undefined → ProgressionService.checkPhase3To4Gate
// returned DEPENDENCY_MISSING.
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
    this.progressionService.setQuizService(quizService); // EXACTLY ONCE at composition
  }
}
```

```typescript
// apps/backend/src/modules/quiz/nest/quiz.module.ts — the forwardRef injection edge
providers: [
  { provide: QuizRepository, useFactory: () => new QuizRepository() },
  {
    provide: QuizService,
    useFactory: (quizRepository: QuizRepository, progressionService: ProgressionService) =>
      new QuizService(quizRepository, progressionService),
    // forwardRef in the inject array — the idiomatic Nest circular-DI resolution:
    // ProgressionService is ALWAYS resolved first (it needs no QuizService).
    inject: [QuizRepository, forwardRef(() => ProgressionService) as never],
  },
  { provide: SandhiDrillService, useFactory: () => new SandhiDrillService() },
],
```

The **as-built fallback** breaks the construction cycle so NO service factory needs the other at construction time: `ProgressionService` is built without `quizService` (the ctor param is optional and `setQuizService` is the documented re-injection seam the Express `app/container.ts` already uses), `QuizService` is built WITH `ProgressionService` (always available first), and `ProgressionQuizBridge.onModuleInit` re-injects `quizService` — Nest guarantees `registerModules()` instantiates EVERY module's providers before `callInitHook()` runs any `onModuleInit`, so `ModuleRef.get(QuizService)` is guaranteed resolved (no ordering race). The mutable `setQuizService` setter is invoked **exactly once at composition time (boot)**, mirroring the Express container — never a per-request escape hatch — which satisfies the AC ("no mutable setter in Nest land UNLESS documented fallback"). Module-level `forwardRef` is kept on both sides (`ProgressionModule` imports `forwardRef(() => QuizModule)`; `QuizModule` imports `forwardRef(() => ProgressionModule)`) so the DI graph resolves at boot. The real (non-type) imports of the peer modules are ESM-hoist-safe (the `forwardRef` callbacks only evaluate after both modules are defined).

### `QuizNestController` — 7 routes verbatim (6 quiz + feedback), guest submit surface calibrated

```typescript
// apps/backend/src/modules/quiz/nest/quiz-nest.controller.ts (route map)
@Controller("v1/quiz")
export class QuizNestController {
  @Get("config") @UseGuards(OptionalAuthGuard)                     // GET /v1/quiz/config
  @Get("questions") @UseGuards(OptionalAuthGuard)                  // GET /v1/quiz/questions
  @Post("attempts") @HttpCode(201) @UseGuards(OptionalAuthGuard)   // POST /v1/quiz/attempts (guest mock 201)
  @Post("attempts/:id/answers") @HttpCode(200) @UseGuards(OptionalAuthGuard) // POST .../answers (guest mock 200)
  @Put("attempts/:id/complete") @UseGuards(OptionalAuthGuard)      // PUT .../complete (guest mock)
  @Get("attempts") @UseGuards(RequireAuthGuard)                    // GET /v1/quiz/attempts (guest → 401)
  @Post("feedback") @HttpCode(200) @UseGuards(RequireAuthGuard)    // POST /v1/quiz/feedback (guest → 401)
}
```

The guest submit surface (`config`, `questions`, `attempts` POST, `answers`, `complete`) uses the **calibrated `OptionalAuthGuard`** (24-5): a guest proceeds with `req.userId` **undefined** and the controller returns **session-local mock shapes** — a mock attempt (`{ id: crypto.randomUUID(), quizType, phase, totalScore: null, maxScore: null, passed: false, completedAt: null, createdAt, userId: null }`, `@HttpCode(201)`), a locally-computed mock answer (`correct = normalizePinyinForComparison(pinyinInput) === normalizePinyinForComparison(correctPinyin) && areTonesEquivalent(selectedTone, correctTone)`, `@HttpCode(200)`), and a mock completion (`{ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 }`) — **no persistence, no tracking, never 401, never another user's rows** (F6). `GET /v1/quiz/attempts` → `RequireAuthGuard` (a guest never reads persisted attempts; the `if (!userId) return []` branch is defense-in-depth, unreachable under the guard). `POST /v1/quiz/feedback` → `RequireAuthGuard` (AI/vendor-cost generation is registered-only per S11/P11 — guests never incur generation cost); the handler is 1:1 with `aiFeedbackRoutes.ts`: `buildFeedbackPrompt` byte-for-byte + `GeminiService.generateText(prompt, { timeout: 5000 })` → `{ explanation, errorType: "ai_feedback" }`; missing fields → 400 `VALIDATION_ERROR`. Status parity via `@HttpCode(...)`: `createQuizAttempt` 201 (Express `res.status(201)`), `submitAnswer` + `generateFeedback` 200 (Nest's POST default is 201 — Express returns 200); `completeQuizAttempt` PUT defaults to 200 (matches Express).

### `SandhiDrillNestController` + the 5–25 clamp

```typescript
// apps/backend/src/modules/quiz/nest/sandhi-drill-nest.controller.ts
@Get("sandhi-drill/questions")
@UseGuards(OptionalAuthGuard)
async getQuestions(@Query("count") countQuery: unknown): Promise<unknown> {
  const countParam = typeof countQuery === "string" ? countQuery : "10";
  const count = parseInt(countParam, 10);
  if (isNaN(count) || count < 1) {
    throw new BadRequestException({ code: "VALIDATION_ERROR", message: "Failed to load sandhi drill questions" });
  }
  const questions = await this.sandhiDrillService.generateQuestions(count); // 5–25 clamp inside
  return questions;
}
```

```typescript
// SandhiDrillService.generateQuestions (UNCHANGED — 5–25 clamp preserved)
async generateQuestions(count: number = 10): Promise<DrillQuestion[]> {
  const clamped = Math.max(5, Math.min(25, count)); // clamped 5-25
  ...
}
```

### `ProgressionNestController` — 7 routes verbatim + the CALIBRATED `/gates` guest branch

```typescript
// apps/backend/src/modules/progression/nest/progression-nest.controller.ts (route map)
@Controller("v1/progression")
export class ProgressionNestController {
  @Get("foundation-progress") @UseGuards(OptionalAuthGuard)          // guest → []
  @Put("foundation-progress/:sectionId") @UseGuards(RequireAuthGuard) // guest → 401
  @Get("phase-gate") @UseGuards(OptionalAuthGuard)                    // guest → createGuestPhaseGate() (24-7)
  @Get("gates") @UseGuards(OptionalAuthGuard)                         // guest → CALIBRATED Phase-1-only
  @Put("phase-gate") @UseGuards(RequireAuthGuard)                     // guest → 401
  @Get("radical-progress") @UseGuards(OptionalAuthGuard)              // guest → []
  @Put("radical-progress/:radicalId") @UseGuards(RequireAuthGuard)    // guest → 401 (+ ReviewItem side-effect)
}
```

The **`/gates` guest branch is CALIBRATED (24-13 — the 24-7 deferred item):** the Nest `getGates` guest branch returns the **Phase-1-only** shape — `phase2Gate`/`characterCountGate`/`phase3To4Gate` all `{ passed: false, reason: "GUEST", details: "Guest — Phase 1 only" }` — agreeing with `createGuestPhaseGate()` (`currentPhase: 1, isGuest: true`) for the same guest identity. This is **NOT** the all-passed `GUEST` object (`passed: true` on every gate) the Express `ProgressionController.getGates` still returns (F6-inconsistent). The Express controller is intentionally **untouched** (dual-mode until the 24-15 unification); the parity harness asserts the calibrated shape on Nest explicitly and documents the Express deviation. `PUT radical-progress/:radicalId` keeps the `ReviewService.recordRating` fire-and-forget side-effect when `memorized` (controller-level orchestration, verbatim the Express controller); `Invalid sectionId`/`Invalid radicalId` → 400 `VALIDATION_ERROR`; every `{error, code}` branch → `HttpException` → 24-3 envelope.

### The quiz AI-feedback rate-limit (10/min/IP) — 1:1 with `aiFeedbackRoutes.ts`

```typescript
// apps/backend/src/nest/rate-limit.config.ts
// ── quiz feedback — [APPLIED] (aiFeedbackRoutes.ts, applied in 24-13) ──────
export const QUIZ_FEEDBACK_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many feedback requests.", code: "RATE_LIMIT" }, // 1:1 with aiFeedbackRoutes.ts
};
const quizFeedbackLimiter = rateLimit(QUIZ_FEEDBACK_LIMITER_CONFIG);
export function rateLimitQuizFeedback(req: Request, res: Response, next: NextFunction): void {
  quizFeedbackLimiter(req, res, next);
}
```

```typescript
// apps/backend/src/nest/configure-app.ts
// Quiz AI-feedback limiter (aiFeedbackRoutes.ts: 10/min per IP) — mounted
// path-scoped exactly like the Express inline feedbackLimiter guards only the
// POST /v1/quiz/feedback route.
expressApp.use("/api/v1/quiz/feedback", rateLimitQuizFeedback);
```

The limiter is `10 req/min per IP` with the same `{ error: "Too many feedback requests.", code: "RATE_LIMIT" }` message body — 1:1 with the inline `feedbackLimiter` in `api/aiFeedbackRoutes.ts` (default IP key), so a 429 on the feedback route is contract-identical.

## Architecture Integration

```
[Story 24-13: Quiz + Progression Port (Circular-DI)]
├── modules/quiz/nest/quiz.module.ts — imports SharedModule + GuardsModule +
│     forwardRef(() => ProgressionModule); QuizRepository/QuizService (inject
│     forwardRef(() => ProgressionService))/SandhiDrillService providers; exports QuizService
├── modules/quiz/nest/quiz-nest.controller.ts — 7 routes verbatim (config/questions/
│     attempts POST @201/answers @200/complete/attempts GET/feedback @200); calibrated
│     OptionalAuthGuard on guest submit surface + RequireAuthGuard on attempts GET/feedback;
│     guest session-local mock shapes; buildFeedbackPrompt + GeminiService
├── modules/quiz/nest/sandhi-drill-nest.controller.ts — GET sandhi-drill/questions
│     (OptionalAuth); 5–25 clamp preserved in SandhiDrillService
├── modules/quiz/nest/__tests__/quiz-nest.controller.test.ts — 18 unit tests
├── modules/quiz/nest/__tests__/sandhi-drill-nest-controller.test.ts — 5 unit tests
├── modules/progression/nest/progression.module.ts — imports SharedModule + GuardsModule +
│     ReviewModule + ReadersModule + forwardRef(() => QuizModule); ProgressionService built
│     WITHOUT quizService; ProgressionQuizBridge; exports ProgressionService
├── modules/progression/nest/progression-nest.controller.ts — 7 routes verbatim;
│     CALIBRATED /gates guest branch (Phase-1-only); ReviewService radical side-effect
├── modules/progression/nest/progression-quiz-bridge.ts — onModuleInit re-injection
│     (ModuleRef.get(QuizService) → setQuizService(), exactly once); 24-13 ADR
├── modules/progression/nest/__tests__/progression-nest.controller.test.ts — 17 unit tests
├── nest/app.module.ts — UPDATE: registers QuizModule + ProgressionModule (no prefix overlap)
├── nest/rate-limit.config.ts — UPDATE: QUIZ_FEEDBACK_LIMITER_CONFIG (10/min/IP)
├── nest/configure-app.ts — UPDATE: mounts rateLimitQuizFeedback on /api/v1/quiz/feedback
├── tests/integration/nest/quiz-progression-parity.test.ts — DB-gated parity harness (28 tests)
├── Express modules/quiz + modules/progression (container.ts, api/QuizController.ts,
│     api/SandhiDrillController.ts, api/quizRoutes.ts, api/aiFeedbackRoutes.ts,
│     api/ProgressionController.ts, api/progressionRoutes.ts) — UNTOUCHED (production
│     surface until 24-15; the /gates all-passed GUEST branch unified there)
└── Dependencies: 24-3 (envelope) · 24-4 (SharedModule) · 24-5 (calibrated guards) ·
      24-7 (createGuestPhaseGate identity) · 24-11 (ReviewModule) · 24-12 (ReadersModule)
```

Dependencies: **24-3** (the `{ code, message, requestId }` envelope the quiz/progression 4xx/5xx inherit), **24-4** (`SharedModule` — `GeminiService` for AI-feedback + the `GATE_THRESHOLDS` infra providers), **24-5** (the calibrated `OptionalAuthGuard`/`RequireAuthGuard` + F6 as the `/gates` calibration port target), **24-7** (`createGuestPhaseGate()` — the calibrated guest identity the `phase-gate`/`gates` guest branches return), **24-11** (`ReviewModule` — the `ReviewService` the progression `radical-progress` memorized side-effect consumes via Nest DI), **24-12** (`ReadersModule` — the exported `ReadersService` `ProgressionService` consumes for the Phase 3→4 gate). Parallel-safety: **additive** — the Express quiz/progression wiring is untouched; **no** `packages/shared-constants` / `packages/shared-types` / FE change; `check:module-boundaries` green. Consumers: **24-14** (the release-safety gate that declares the quiz-FE bugs C, tracked in 26) and **epic-26** (the FE quiz-engine fixes + formats land on the now-ported quiz module; 26's backend work is minimal).

## Technical Challenges & Solutions

### The `progression ↔ quiz` circular-DI — `forwardRef`-direct failed the parity harness; the re-injection bridge shipped

```
Problem: QuizService → ProgressionService (completeQuizAttempt → updatePhaseGate) and
        ProgressionService → QuizService (checkPhase3To4Gate → getComprehensionQuizResult)
        form a true construction cycle. The PRIMARY approach — module-level
        forwardRef(() => ProgressionModule)/(() => QuizModule) + forwardRef inject tokens on
        BOTH service factories — FAILED the parity harness: at boot, whichever useFactory
        provider constructed first received UNDEFINED for its forwardRef'd peer.
Root Cause: Nest's resolveParamToken unwraps a forwardRef and, if the referenced provider is
        not yet instantiated, marks the wrapper `forwardRef: true` and returns `undefined`
        (the injector does NOT load an un-resolved forward-referenced wrapper in the static
        context). With a true cycle, one of the two factories ALWAYS runs before its peer is
        instantiated → the first-constructed service got undefined → ProgressionService
        .checkPhase3To4Gate returned DEPENDENCY_MISSING (a parity failure, surfaced by the
        harness as the arbiter).
Solution (as-built fallback, documented ADR): break the construction cycle so NO factory waits
        on the other, then re-inject via a provider factory step:
          1. ProgressionService is built WITHOUT quizService (optional ctor param — the same
             optionality + setQuizService seam the Express app/container.ts already uses).
          2. QuizService is built WITH forwardRef(() => ProgressionService) — always resolved
             first (it needs no QuizService).
          3. ProgressionQuizBridge.onModuleInit re-injects quizService via
             ModuleRef.get(QuizService, { strict: false }) + setQuizService() — exactly once
             at composition (Nest instantiates every provider before callInitHook runs any
             onModuleInit, so ModuleRef.get is guaranteed resolved — no ordering race).
        Module-level forwardRef is kept on both sides for the DI graph; the real peer-module
        imports are ESM-hoist-safe (the callbacks only evaluate after both modules are defined).
Impact: the highest-risk DI item in the epic is resolved with an auditable ADR (recorded in
        progression-quiz-bridge.ts + both module docstrings); the parity harness proves the
        boot is cycle-free and both services are fully wired (the DEPENDENCY_MISSING failure
        is gone); the mutable setter is documented + invoked once at composition, satisfying
        the AC ("no mutable setter unless documented fallback").
Alternatives Considered: (a) forwardRef-direct (PRIMARY — tried, failed the harness, recorded);
        (b) the re-injection bridge (CHOSEN); (c) collapsing the two services into one module
        (rejected — violates module-boundary discipline); (d) a global provider / custom
        provider factory that mutates after resolution (rejected — same mutable-setter concern,
        less explicit than the documented bridge).
```

### The quiz question `id` shuffle-position normalization — non-deterministic 2xx deep-equal

```
Problem: the audio-to-pinyin-tone question pool is SHUFFLED at generation, and each question's
        `id` is `q-${index+1}` — i.e. the id encodes the SHUFFLE POSITION, which differs
        between the Express app and the Nest app for the same request. The `category` is also
        `Math.random`-driven. A naive 2xx deep-equal in the parity harness therefore always
        fails, even though both apps generate the same logical pool.
Root Cause: the backend engine (strategies/registry.ts) is shared and correct, but the
        generated question rows carry per-run non-determinism (shuffle order + random
        category); deep-equal must compare the pool as a SET, not the shuffled rows.
Solution: normalizeQuizQuestions() in the parity harness (a) sorts the questions by the unique
        `audioKey` (so the shuffled orders line up), (b) replaces the non-deterministic `id`
        with the sentinel "QID" and `category` with the sentinel "CAT", then deep-equals the
        normalized arrays — the pool SET + all other fields are byte-compared. Sandhi-drill
        questions get the same treatment (sort by `id`, options sorted); guest mock
        attempt/answer rows carry crypto.randomUUID() + now() → normalized to sentinels; the
        authed complete path uses a SHARED attempt (created via Express, submitted once) so
        both apps evaluate the SAME answers → deep-equal result.
Impact: the parity harness proves the backend engine shape is byte-identical (modulo the
        documented per-run non-determinism) — no backend bug canonized, and the C-declared
        FE quiz bugs are never silently validated as fixed.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — quiz: `quizConfig` (`GET`), `quizQuestions` (`GET`), `quizAttempts` (`POST`+`GET`), `quizAttemptAnswer(id)` (`POST`), `quizAttemptComplete(id)` (`PUT`), `quizFeedback` (`POST`), `quizSandhiDrill` (`GET`); progression: `progressionFoundationProgress` (`GET`+`PUT`), `progressionFoundationProgressSection(sectionId)` (`PUT`), `progressionPhaseGate` (`GET`+`PUT`), `progressionGates` (`GET`), `progressionRadicalProgress` (`GET`+`PUT`), `progressionRadicalProgressById(radicalId)` (`PUT`); `/api` prefix applied by the shell
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `QuizModule`/`QuizNestController`/`SandhiDrillNestController`/`ProgressionModule`/`ProgressionNestController`/`ProgressionQuizBridge`/`QuizService`/`ProgressionService`/`SandhiDrillService`/`ProgressionRepository`/`QuizRepository`/`QUIZ_FEEDBACK_LIMITER_CONFIG`/`rateLimitQuizFeedback` copied from the shipped `modules/quiz/nest/**`, `modules/progression/nest/**`, `nest/rate-limit.config.ts`, `nest/configure-app.ts` files (commit `e68e668a`)
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — quiz/progression are DB-backed via the shared Prisma singleton (`QuizRepository`/`ProgressionRepository` self-import Prisma, same as Express) + Gemini (`GeminiService` for AI-feedback) + the 5-strategy registry (shared `content`/strategy pool); the parity harness registers real users via Express `/auth/register` and module-mocks `GeminiService` (DB-gated via `checkDatabase`)
- [x] All relative markdown links resolve (sibling story BRs 24-3/24-4/24-5/24-7/24-11/24-12 exist; the epic BR README exists; the IMP twin path resolves)
- [x] Last Updated / Last Update date is current (same commit as the edit)
- [x] **Truth-check correction:** the implementation plan's "parity harness (31 tests)" overstates the shipped harness — `tests/integration/nest/quiz-progression-parity.test.ts` contains **28 `it()` cases** (direct file count). Derived totals: `test:full` **744** (baseline 704 from the committed 24-12 doc + **40** new unit tests — quiz-nest 18 + sandhi-drill 5 + progression-nest 17) and `test:integration` **259** (baseline 231 + **28** parity); the story's plan figure "integration 262 (+31)" is not supported by the code.

## Testing Implementation

- **Controller unit tests** (3 suites, **40 tests**) — services mocked (no real DB/Gemini):
  - `quiz-nest.controller.test.ts` (**18**) — per-route success + guest-mock shapes (mock attempt `@HttpCode(201)` with `phase ?? 1`, locally-computed mock answer correctness via `normalizePinyinForComparison`/`areTonesEquivalent`, mock completion `{ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 }`), registered-user delegation with `req.userId`, error mapping — 500 `INTERNAL_ERROR`/`LOAD_ERROR`/`VALIDATION_ERROR`, 400 `VALIDATION_ERROR` (feedback missing fields — **no Gemini call**), defaults (type `audio-to-pinyin-tone`/count 20/phase 1), explicit pass-through.
  - `sandhi-drill-nest-controller.test.ts` (**5**) — delegated count, default 10, `count<1` → 400 `VALIDATION_ERROR` (no service call), non-numeric → 400, service error → 500 `LOAD_ERROR`.
  - `progression-nest.controller.test.ts` (**17**) — per-route success/guest/error mapping, calibrated guest `phase-gate` (`createGuestPhaseGate` Phase-1 `isGuest`) + `/gates` (**Phase-1-only, NOT all-passed**) branches, guest `[]` reads, guest no-op writes, `ReviewItem` side-effect (memorized true → `recordRating` fire-and-forget; false → no call), 400 `VALIDATION_ERROR` (`Invalid sectionId`/`Invalid radicalId`), 500 `LOAD_FAILED`/`UPDATE_FAILED`.
- **DB-gated parity harness** (`tests/integration/nest/quiz-progression-parity.test.ts`, **28 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` on a missing DB. `GeminiService` is **module-mocked** (both apps construct the same `MockGeminiService` → deterministic `{ explanation, errorType: "ai_feedback" }` with zero external calls — the feedback route is fully exercised). Real users registered via the Express `/auth/register` endpoint (rows cleaned in `afterAll`); unique TEST-NET-3 `X-Forwarded-For` IPs per request so the feedback (10/min) and auth brute-force limiters never trip. Coverage:
  - **quiz guest 2xx (5)**: config all-strategies deep-equal · config?type=ime-simulator deep-equal · attempts POST 201 guest-mock deep-equal (normalized) · answers POST 200 guest-mock deep-equal (normalized) · complete PUT 200 guest-mock deep-equal. Plus questions + sandhi-drill normalized deep-equal (shuffle-order/`category` sentineled `QID`/`CAT`, sort by `audioKey`/`id`).
  - **quiz guest 401 (2)**: attempts GET → 401 `AUTH_REQUIRED` · feedback POST → 401 `AUTH_REQUIRED`.
  - **quiz authed (5)**: attempts POST 201 status + shape parity (rows differ by design) · answers POST 200 evaluated `correct` parity (shared attempt) · complete PUT 200 deep-equal result (shared attempt, 1 answer) · attempts GET 200 deep-equal (shared DB rows, sorted by id) · feedback valid input → 200 `{ explanation, errorType }` deep-equal (mocked Gemini) + missing fields → 400 `VALIDATION_ERROR`.
  - **quiz 400 validation (1)**: sandhi-drill `?count=0` → 400 `VALIDATION_ERROR` parity.
  - **progression guest (4)**: foundation-progress → 200 `[]` deep-equal · phase-gate → 200 calibrated `createGuestPhaseGate` (normalized timestamps, `isGuest: true`) · radical-progress → 200 `[]` deep-equal · **gates → CALIBRATED Phase-1-only shape on Nest** (NOT the Express all-passed `GUEST` — asserted explicitly, deviation documented).
  - **progression guest 401 (3)**: foundation-progress PUT · phase-gate PUT · radical-progress PUT → 401 `AUTH_REQUIRED`.
  - **progression authed (8)**: foundation-progress GET 200 deep-equal (Express creates 4, Nest reads the same rows — sequential) · phase-gate GET 200 deep-equal (shared gate row) · gates GET 200 deep-equal (computed gates, shared data) · radical-progress GET 200 `[]` deep-equal (fresh user) · foundation-progress PUT 200 normalized shape parity (distinct sections) · phase-gate PUT 200 status + phase-gate parity (userB) · radical-progress PUT 200 normalized shape parity + **ReviewItem side-effect** (distinct radicals) · invalid radical-progress PUT → 400 `VALIDATION_ERROR` parity.
  - **Circular-DI arbiter**: if `forwardRef`-direct had failed at boot, `NestFactory.create(AppModule)` throws and the whole suite fails — green proves the as-built re-injection bridge constructs both services fully (no `DEPENDENCY_MISSING`).
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` ✅ **744 tests (was 704; +40 unit)** · `test:integration` ✅ **259 tests (was 231; +28 parity)** · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke ✅ (boot has no circular-DI runtime errors — the bridge re-injects cleanly; `/api/v1/progression/gates` guest = calibrated Phase-1-only; `/api/v1/quiz/attempts` guest → 401 `AUTH_REQUIRED`).
