**Last Updated:** August 21, 2026

# Implementation 24-12: Readers Port

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-12-readers-port.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `20a3c36c`

## Implementation Summary

Ported the `readers` module — the **largest port** (11 routes; `SegmenterService`/`PassageGenerationService`/`ReadersAudioService` + the DB-backed 5/day generation rate-limit) — from Express to the NestJS 11 shell under `apps/backend/src/modules/readers/nest/`. This is the first port that **moves service ownership into the Nest module** and the first **cross-module audio consumer**: `ReadersAudioService` consumes the audio facade + passage path helpers from the ported `AudioModule` via Nest DI, replacing the Express wiring's direct `modules/audio/index.js` function import.

**`readers.module.ts` = all 5 services as `useFactory` providers (imports `SharedModule` + `GuardsModule` + `AudioModule`).** `ReadersRepository` via `useFactory: () => new ReadersRepository()` (self-imports the shared Prisma singleton, same as Express); `PassageGenerationService` via `useFactory(geminiService)` (`GeminiService` from `SharedModule`, 24-4); `SegmenterService` via `useFactory(cacheService)` (`CacheService` from `SharedModule`); `ReadersAudioService` via `useFactory(audioService, passagePathHelpers)` — **`AudioService` + `AUDIO_PASSAGE_PATHS` injected from the ported `AudioModule`** (24-10); `ReadersService` via `useFactory(repository, passageGenService, segmenterService, cacheService, readersAudioService)` — the same five deps `createReadersModule(deps)` passes. **`exports: [ReadersService]`.** Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop.

**`readers-nest.controller.ts` = 11 routes 1:1** (`@Controller("v1/readers")`), mirroring `api/ReadersController.ts` verbatim: same query/body/path string-coercion parsing, same service delegation, same 2xx JSON (incl. `formatPassageResponse` date serialization — `generatedAt`/`createdAt`/`updatedAt` → ISO strings, `lastAccessedAt ?? null`, raw `content` stripped), and **every `{error, code}` branch → `HttpException` → 24-3 envelope** (`BadRequestException` 400 `VALIDATION_ERROR`, `NotFoundException` 404 `NOT_FOUND`, `UnauthorizedException` 401 `AUTH_ERROR`, `BadGatewayException` 502 `GENERATION_ERROR`, `InternalServerErrorException` 500 `INTERNAL_ERROR`/`LOAD_ERROR`, and `HttpException` 429 `RATE_LIMIT`). Status parity: audio POST `@HttpCode(200)`, generate `@HttpCode(201)`, complete `@HttpCode(200)`, addBookmark `@HttpCode(201)`, bookmark DELETE `@HttpCode(204)`.

**Service-ownership move:** `SegmenterService`/`PassageGenerationService`/`ReadersAudioService` were **root-instantiated in `app/container.ts`** (`new SegmenterService(cacheService)`, `new PassageGenerationService(geminiService)`, `new ReadersAudioService(audioService, ...)`); they are now **`ReadersModule` providers**. The Express surface keeps the **same classes** via a container wiring change (dual-mode) — only the wiring differs.

**`ReadersAudioService` → Nest DI:** the direct `passageHashFor`/`passagePath` **value** import from `modules/audio/index.js` is removed; the constructor now takes `PassagePathHelpers` (`passageHashFor`/`passagePath`) **plus** the `AudioService` facade. `ReadersModule` injects both from the ported `AudioModule` — `AudioService` (exported since 24-10) **and** the **additive `AUDIO_PASSAGE_PATHS` provider** (`{ passageHashFor, passagePath }` value-provided and exported by `AudioModule`). The `AudioServiceLike` type import is **type-only and erased** — no `modules/audio` barrel, value OR type, is imported from readers Nest land. The Express `app/container.ts` passes the same helpers (`new ReadersAudioService(audioService, { passageHashFor, passagePath })`) — **dual-mode, same class, only the wiring differs**.

**5/day rate-limit (unchanged, DB-backed):** `ReadersService.checkRateLimits` (unchanged) → `ReadersRepository.countUserGeneratedToday` (DB-backed, UTC-midnight reset: `generatedAt >= todayStart`) + the 5-passage storage cap (`countUserGenerated`); `READERS_DAILY_GENERATION_LIMIT = 5` declared in `rate-limit.config.ts`; the Nest controller maps `RateLimitExceededError` → 429 `RATE_LIMIT` (24-3 envelope). Note (truth-check): the story plan's "shared `WordRepository`" mention **does not apply to passage generation** — the DB-backed counts live on **`ReadersRepository`** (`countUserGeneratedToday`/`countUserGenerated`), consistent with Express. The per-route `express-rate-limit` GET limiters (60/min user, 20/min guest) apply only to the two passage GET routes via `rateLimitReadersByAuth` mounted path-scoped in `configure-app.ts` (`/api/v1/readers/passages`), mirroring `readersRoutes.ts`; the audio POST / generate / sessions / bookmarks routes carry no `express-rate-limit`, exactly like Express.

**Auth per route (calibrated 24-5):** `GET passages`, `GET passages/:id`, `POST passages/:id/audio` → **`OptionalAuthGuard`** (guest → `req.userId` undefined, **never 401**; passage-audio **cache-first free for guests**, F5). `POST generate`, `GET/PUT sessions/:passageId`, `POST sessions/:passageId/complete`, `GET/POST bookmarks`, `DELETE/GET bookmarks/by-passage/:passageId` → **`RequireAuthGuard`** (guest → 401 `AUTH_REQUIRED` before the controller); the `if (!userId)` 401 `AUTH_ERROR` checks on the user-scoped routes are defense-in-depth mirroring the Express controller structure (unreachable under the guard; unit-tested directly).

**Parity harness `readers-parity.test.ts` (28 tests, DB-gated)** — boots the real Express app + real Nest `AppModule` in-process: 2xx deep-equal with non-deterministic-field normalization (dates, generated-content core), 4xx/5xx `{ code, message, requestId }` envelope deep-equal, guest 401s (`AUTH_REQUIRED`) on generate/sessions/bookmarks with **no passage written**, the 5/day 429 (**no Gemini call**), sessions upsert + position update + complete idempotency, bookmarks add/list/check/delete, and **mocked-GCS** audio cache-hit (`source: "gcs"`) / cache-miss (`source: "ondemand"`).

**`ReadersAudioController.test.ts` kept untouched + passing** — the 24-11 stale-flag disposition is closed: the Express-side test (`apps/backend/src/modules/readers/api/__tests__/ReadersAudioController.test.ts`) is **NOT dead** — it uniquely covers the live `ReadersController.getPassageAudio` method (mounted until 24-15), so it stays as-is (its Nest-land coverage is added by this story's parity harness + unit tests; the Express original is retired at 24-15).

**Verification (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ **704 tests (was 666; +38** — the `readers-nest-controller.test.ts` unit suite) · `test:integration` ✅ **231 tests (was 203; +28** — the readers parity harness) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (passage-audio POST 200 with **real GCS signed URLs** — proving `AudioModule` DI end-to-end on the live shell; guest generate → 401 `AUTH_REQUIRED`).

## Technical Scope

Port the `readers` module (11 routes) to the NestJS 11 shell with contract-identical behavior AND the service-ownership move + the cross-module audio-DI resolution + the DB-backed 5/day rate-limit reproduction: a `ReadersModule` (all 5 services as `useFactory` providers; imports `SharedModule` + `GuardsModule` + `AudioModule`; exports `ReadersService`) with a verbatim `ReadersNestController` (11 routes, calibrated `OptionalAuthGuard` on the three public-ish reads + `RequireAuthGuard` on the user-scoped routes, `@HttpCode` status parity, `formatPassageResponse` date serialization, every `{error, code}` branch → `HttpException` → 24-3 envelope); `ReadersAudioService` constructor-DI change (audio facade + `PassagePathHelpers`, no direct `modules/audio` import); `app/container.ts` dual-mode wiring change (same class, helpers passed in); `AudioModule` additive `AUDIO_PASSAGE_PATHS` provider + export; readers rate-limiters + `READERS_DAILY_GENERATION_LIMIT` in `rate-limit.config.ts` + path-scoped mount in `configure-app.ts`; `app.module.ts` registration; plus a unit suite (38 tests) and a dedicated DB-backed parity harness (28 tests). The Express readers wiring is untouched.

**Files:**

- `apps/backend/src/modules/readers/nest/readers.module.ts` — **NEW**: `ReadersModule` — all 5 services as `useFactory` providers (imports `SharedModule` + `GuardsModule` + `AudioModule`; `ReadersRepository`/`PassageGenerationService`/`SegmenterService`/`ReadersAudioService`/`ReadersService`); **`exports: [ReadersService]`**.
- `apps/backend/src/modules/readers/nest/readers-nest.controller.ts` — **NEW**: `ReadersNestController` (`@Controller("v1/readers")`) — **11 routes verbatim** (`GET passages`, `GET passages/:id`, `POST passages/:id/audio` @`HttpCode(200)` OptionalAuth; `POST generate` @`HttpCode(201)` RequireAuth; `GET/PUT sessions/:passageId`, `POST sessions/:passageId/complete` @`HttpCode(200)`, `GET/POST bookmarks`, `DELETE bookmarks/by-passage/:passageId` @`HttpCode(204)`, `GET bookmarks/by-passage/:passageId` — all RequireAuth); `formatPassageResponse` date serialization; every `{error, code}` branch → `HttpException` → 24-3 envelope; `RateLimitExceededError` → 429 `RATE_LIMIT`.
- `apps/backend/src/modules/readers/nest/__tests__/readers-nest-controller.test.ts` — **NEW**: unit tests (**38**) — mocked `ReadersService`; per-route success + validation/error mapping (400 `VALIDATION_ERROR`, 404 `NOT_FOUND`, 401 `AUTH_ERROR`, 429 `RATE_LIMIT`, 502 `GENERATION_ERROR`, 500 `INTERNAL_ERROR`/`LOAD_ERROR`), date serialization, `hskLevel` coercion, `currentSentence` validation, defensive 401s.
- `apps/backend/src/modules/readers/services/ReadersAudioService.ts` — **UPDATE**: ctor now takes `(audioService, passagePathHelpers: PassagePathHelpers)`; direct `passageHashFor`/`passagePath` value import removed (type-only `AudioServiceLike` import erased at compile); the `PassagePathHelpers` interface documented for Nest DI.
- `apps/backend/src/modules/readers/services/__tests__/ReadersAudioService.test.ts` — **UPDATE**: passes the real `passageHashFor`/`passagePath` helpers into the ctor (hash determinism preserved via the mocked `hashUtils.computeHash`).
- `apps/backend/src/modules/audio/nest/audio.module.ts` — **UPDATE**: **additive `AUDIO_PASSAGE_PATHS` provider** (`useValue: { passageHashFor, passagePath }`) **+ exported** so `ReadersModule` resolves the passage path helpers via module-to-module Nest DI.
- `apps/backend/src/app/container.ts` — **UPDATE**: dual-mode wiring change — `new ReadersAudioService(audioService, { passageHashFor, passagePath })` (helpers injected; no direct `modules/audio` import in the service).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import + register `ReadersModule` (path `/v1/readers/*` shares no prefix with any other module).
- `apps/backend/src/nest/rate-limit.config.ts` — **UPDATE**: `READERS_GET_LIMITER_CONFIG` (60/min user) + `READERS_GUEST_GET_LIMITER_CONFIG` (20/min guest) + `rateLimitReadersByAuth` dispatcher (GET-only, path-scoped) + `READERS_DAILY_GENERATION_LIMIT = 5` (DB-backed, enforced in `ReadersService.checkRateLimits`).
- `apps/backend/src/nest/configure-app.ts` — **UPDATE**: mount `expressApp.use("/api/v1/readers/passages", rateLimitReadersByAuth)` (the two passage GET routes, GET-only method check keeps the audio POST un-limited, exactly like Express).
- `apps/backend/tests/integration/nest/readers-parity.test.ts` — **NEW**: DB-gated parity harness (**28 tests**) — boots the real Express app + real Nest `AppModule`; real users registered via Express `/auth/register`; mocked-GCS audio + unique TEST-NET-3 `X-Forwarded-For` IPs.

## Implementation Details

### ReadersModule — all 5 services as `useFactory` providers, `AudioModule` imported

```typescript
// apps/backend/src/modules/readers/nest/readers.module.ts
@Module({
  imports: [SharedModule, GuardsModule, AudioModule], // ← AudioModule: AudioService + AUDIO_PASSAGE_PATHS
  controllers: [ReadersNestController],
  providers: [
    { provide: ReadersRepository, useFactory: () => new ReadersRepository() },
    {
      provide: PassageGenerationService,
      useFactory: (geminiService: GeminiService) => new PassageGenerationService(geminiService),
      inject: [GeminiService],
    },
    {
      provide: SegmenterService,
      useFactory: (cacheService: CacheService) => new SegmenterService(cacheService),
      inject: [CacheService],
    },
    {
      provide: ReadersAudioService,
      useFactory: (audioService: AudioService, passagePathHelpers: PassagePathHelpers) =>
        new ReadersAudioService(audioService, passagePathHelpers),
      inject: [AudioService, AUDIO_PASSAGE_PATHS],
    },
    {
      provide: ReadersService,
      useFactory: (repository, passageGenService, segmenterService, cacheService, readersAudioService) =>
        new ReadersService(repository, passageGenService, segmenterService, cacheService, readersAudioService),
      inject: [ReadersRepository, PassageGenerationService, SegmenterService, CacheService, ReadersAudioService],
    },
  ],
  exports: [ReadersService],
})
export class ReadersModule {}
```

Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop; the compiled tsc build gets metadata for free. `SharedModule` supplies `CacheService`/`GeminiService` (24-4); `GuardsModule` supplies the calibrated `OptionalAuthGuard`/`RequireAuthGuard` + their `JwtService` (24-5); **`AudioModule` supplies `AudioService` (exported since 24-10) and the additive `AUDIO_PASSAGE_PATHS` provider** — the module-to-module DI edge that replaces the Express wiring's direct `modules/audio/index.js` function import. The three services that were **root-instantiated in `app/container.ts`** (`SegmenterService`/`PassageGenerationService`/`ReadersAudioService`) are now module providers — service ownership moved into the module; the Express surface keeps the same classes (dual-mode).

### The `ReadersAudioService` audio-DI resolution

```typescript
// apps/backend/src/modules/readers/services/ReadersAudioService.ts (ctor change)
export interface PassagePathHelpers {
  passageHashFor(sentenceTexts: string[]): string;
  passagePath(passageHash: string, index: number): string;
}

export class ReadersAudioService {
  constructor(
    private readonly audioService: AudioServiceLike, // ← type-only import (erased at compile)
    private readonly passagePathHelpers: PassagePathHelpers, // ← DI, not a direct modules/audio import
  ) { ... }
}
```

The Express wiring previously imported `passageHashFor`/`passagePath` **by value** from `modules/audio/index.js` and passed them into the service. The port removes that **value** import: the ctor now takes a `PassagePathHelpers` (`passageHashFor`/`passagePath`), and the Nest `ReadersModule` injects both from the ported `AudioModule` — `AudioService` plus the **additive `AUDIO_PASSAGE_PATHS` provider** (`useValue: { passageHashFor, passagePath }`, exported so the readers module can consume it). The `AudioServiceLike` type import remains **type-only** (`import type`) and is **erased at compile** — so no `modules/audio` barrel, value OR type, exists in readers Nest land. The Express `app/container.ts` keeps the same class and passes the same helpers in its wiring (`new ReadersAudioService(audioService, { passageHashFor, passagePath })`) — dual-mode, same class, only the wiring differs.

### The 5/day generation rate-limit — unchanged, DB-backed, reproduced as-is

```typescript
// ReadersService.checkRateLimits (UNCHANGED — reproduced as-is on the Nest surface)
private async checkRateLimits(userId: string): Promise<void> {
  const todayCount = await this.repository.countUserGeneratedToday(userId); // UTC midnight
  if (todayCount >= MAX_DAILY_GENERATIONS) { // = 5
    throw new RateLimitExceededError(`Daily generation limit reached (${MAX_DAILY_GENERATIONS}/day)`);
  }
  const totalCount = await this.repository.countUserGenerated(userId);
  if (totalCount >= MAX_USER_PASSAGES) { // = 5 storage cap
    throw new RateLimitExceededError(`Storage limit reached (max ${MAX_USER_PASSAGES} generated passages). Delete some to generate more.`);
  }
}
```

```typescript
// ReadersRepository.countUserGeneratedToday (UNCHANGED — DB-backed, UTC-midnight reset)
async countUserGeneratedToday(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  return prisma.passage.count({ where: { generatedById: userId, generatedAt: { gte: todayStart } } });
}
```

```typescript
// readers-nest.controller.ts — RateLimitExceededError → 429 RATE_LIMIT (24-3 envelope)
if (err instanceof RateLimitExceededError) {
  throw new HttpException({ code: "RATE_LIMIT", message: "Failed to generate passage" }, 429);
}
```

The 5/day generation limit is **DB-backed** (not an `express-rate-limit` window): `ReadersService.checkRateLimits` counts today's generated rows via `ReadersRepository.countUserGeneratedToday` (UTC-midnight reset) against `MAX_DAILY_GENERATIONS = 5`, plus the `MAX_USER_PASSAGES = 5` total-storage cap; `READERS_DAILY_GENERATION_LIMIT = 5` is declared in `rate-limit.config.ts`; the Nest controller maps `RateLimitExceededError` → 429 `RATE_LIMIT` (24-3 envelope), byte-for-byte matching the Express `ReadersController`'s 429 `{ error, code: "RATE_LIMIT" }` branch. **Truth-check correction:** the story plan's "shared `WordRepository`" mention does not apply to passage generation — the DB-backed counts live on **`ReadersRepository`** (consistent with Express), not a shared word repository. The per-route `express-rate-limit` GET limiters (60/min user, 20/min guest) are separate — they apply only to the two passage GET routes via `rateLimitReadersByAuth` mounted path-scoped in `configure-app.ts` (`/api/v1/readers/passages`), mirroring `readersRoutes.ts` exactly (audio POST / generate / sessions / bookmarks carry no `express-rate-limit` in Express).

### `ReadersNestController` — 11 routes verbatim

```typescript
// apps/backend/src/modules/readers/nest/readers-nest.controller.ts (route map)
@Controller("v1/readers")
export class ReadersNestController {
  @Get("passages") @UseGuards(OptionalAuthGuard)                    // GET /v1/readers/passages
  @Get("passages/:id") @UseGuards(OptionalAuthGuard)                // GET /v1/readers/passages/:id
  @Post("passages/:id/audio") @HttpCode(200) @UseGuards(OptionalAuthGuard) // POST .../audio (F5 cache-first)
  @Post("generate") @HttpCode(201) @UseGuards(RequireAuthGuard)      // POST /v1/readers/generate (5/day)
  @Get("sessions/:passageId") @UseGuards(RequireAuthGuard)           // GET .../sessions/:passageId
  @Put("sessions/:passageId") @UseGuards(RequireAuthGuard)           // PUT .../sessions/:passageId
  @Post("sessions/:passageId/complete") @HttpCode(200) @UseGuards(RequireAuthGuard)
  @Get("bookmarks") @UseGuards(RequireAuthGuard)                     // GET /v1/readers/bookmarks
  @Post("bookmarks") @HttpCode(201) @UseGuards(RequireAuthGuard)     // POST /v1/readers/bookmarks
  @Delete("bookmarks/by-passage/:passageId") @HttpCode(204) @UseGuards(RequireAuthGuard)
  @Get("bookmarks/by-passage/:passageId") @UseGuards(RequireAuthGuard)
}
```

The controller mirrors `api/ReadersController.ts` 1:1 — same query/body/path string-coercion parsing (`hskLevel` `Number()` + 1–6 range check, `topic` trim + 100-char cap, `currentSentence` integer ≥ 0, `passageId` presence/string checks), same service delegation, same 2xx JSON (incl. the `formatPassageResponse` date serialization: `generatedAt`/`createdAt`/`updatedAt` → `toISOString()`, `lastAccessedAt?.toISOString() ?? null`, raw `content` stripped, plus `sentences`/`segments`/`hskProfile`), and **every `{error, code}` branch → `HttpException`** — serialized by the global 24-3 `AppExceptionFilter` into the `{ code, message, requestId }` envelope (`code`/`message` byte-for-byte equal to the Express controller's legacy `{ error, code }` body). Status parity via `@HttpCode(...)`: audio POST 200, generate 201, complete 200, addBookmark 201, bookmark DELETE 204 (empty body — `res.status(204).send()`). The `if (!userId)` 401 `AUTH_ERROR` checks on the user-scoped routes are defense-in-depth mirroring the Express controller structure (unreachable under `RequireAuthGuard`; unit-tested directly).

## Architecture Integration

```
[Story 24-12: Readers Port]
├── modules/readers/nest/readers.module.ts — all 5 services as useFactory providers; imports
│     SharedModule + GuardsModule + AudioModule; exports ReadersService
├── modules/readers/nest/readers-nest.controller.ts — 11 routes verbatim; formatPassageResponse
│     date serialization; every {error,code} branch → HttpException → 24-3 envelope;
│     OptionalAuth (passages/audio, F5) + RequireAuth (generate/sessions/bookmarks)
├── modules/readers/nest/__tests__/readers-nest-controller.test.ts — 38 unit tests
├── modules/readers/services/ReadersAudioService.ts — UPDATE: ctor (audioService, PassagePathHelpers);
│     direct modules/audio value import removed (type-only AudioServiceLike erased)
├── modules/readers/services/__tests__/ReadersAudioService.test.ts — UPDATE: real helpers passed in
├── modules/audio/nest/audio.module.ts — UPDATE: additive AUDIO_PASSAGE_PATHS provider + exported
├── app/container.ts — UPDATE: dual-mode wiring (same class, helpers injected)
├── nest/app.module.ts — UPDATE: registers ReadersModule (no prefix overlap)
├── nest/rate-limit.config.ts — UPDATE: readers GET limiters + READERS_DAILY_GENERATION_LIMIT = 5
├── nest/configure-app.ts — UPDATE: mounts rateLimitReadersByAuth on /api/v1/readers/passages
├── tests/integration/nest/readers-parity.test.ts — DB-gated parity harness (28 tests)
├── Express modules/readers (container.ts, api/ReadersController.ts, api/readersRoutes.ts,
│     api/__tests__/ReadersAudioController.test.ts) — UNTOUCHED (production surface until 24-15;
│     the test uniquely covers live getPassageAudio)
└── Dependencies: 24-3 (envelope) · 24-4 (SharedModule) · 24-5 (calibrated guards) · 24-10 (AudioModule)
```

Dependencies: **24-3** (the `{ code, message, requestId }` envelope the readers 4xx/5xx inherit), **24-4** (`SharedModule` — `CacheService`/`GeminiService`), **24-5** (the calibrated `OptionalAuthGuard`/`RequireAuthGuard`), **24-10** (`AudioModule` — exported `AudioService` + the additive `AUDIO_PASSAGE_PATHS` provider `ReadersAudioService` consumes via Nest DI). Parallel-safety: **additive** — the Express readers wiring is untouched; **no** `packages/shared-constants` / `packages/shared-types` / FE change; **no** 25–28 collision-zone file touched (beyond the readers/audio module Nest surfaces this story owns); `check:module-boundaries` green. Consumer: **24-13 (quiz + progression)** — the service-ownership-into-module pattern this story establishes is the template the remaining ports rely on.

## Technical Challenges & Solutions

### The service-ownership move — root-instantiated services into the Nest module

```
Problem: the readers services (SegmenterService / PassageGenerationService / ReadersAudioService)
        were NOT created by the module's own factory — they were root-instantiated singletons in
        app/container.ts (`new SegmenterService(cacheService)`, etc.) and passed into
        createReadersModule(deps). A naive Nest port would have either (a) re-instantiated them
        per-module with duplicated wiring, or (b) left them in the container and imported them,
        breaking the module-boundary discipline the shell has maintained.
Root Cause: the Express DI container (app/container.ts) wires cross-cutting singletons and passes
        them into each module factory at the composition root. Nest's module system owns provider
        construction inside the module, so the ownership had to move.
Solution: `ReadersModule` declares all five services as `useFactory` providers, constructor-injecting
        their deps from `SharedModule` (`CacheService`/`GeminiService`) + `AudioModule`
        (`AudioService`/`AUDIO_PASSAGE_PATHS`). The Express surface keeps the SAME classes via a
        container wiring change (dual-mode) — the services themselves are unchanged; only the
        wiring differs. `check:module-boundaries` stays green.
Impact: proves the "service ownership into the module" pattern for the remaining ports (24-13), and
        keeps a single source of truth for each service's construction.
```

### The `ReadersAudioService` audio-DI resolution — no direct `modules/audio` import in Nest land

```
Problem: ReadersAudioService needs the audio facade (`synthesizeToPath`) AND the passage path
        helpers (`passageHashFor`/`passagePath`). The Express readers wiring imported the helpers
        by VALUE from `modules/audio/index.js` — the exact class of direct cross-module barrel
        import the shell eliminated for health (24-10). Porting readers naively (re-importing the
        helpers) would reintroduce the cross-module dependency in Nest land.
Root Cause: the audio path helpers are framework-agnostic primitives owned by the audio module;
        the Express wiring happens to import them directly at the container boundary.
Solution: `AudioModule` gained an additive `AUDIO_PASSAGE_PATHS` provider (`useValue: { passageHashFor,
        passagePath }`, exported) — the module-to-module DI edge. `ReadersAudioService` now takes a
        `PassagePathHelpers` in its constructor; `ReadersModule` injects `AudioService` +
        `AUDIO_PASSAGE_PATHS` from `AudioModule`. The `AudioServiceLike` type import is type-only
        and erased at compile — no `modules/audio` barrel, value OR type, in readers Nest land.
        The Express `app/container.ts` passes the same helpers into the same class (dual-mode).
Impact: the shell's second module-to-module DI edge (after 24-10 health) is proven; readers (the
        largest audio consumer) never crosses the audio barrel; boundaries stay green.
```

### The DB-backed 5/day rate-limit reproduction — DB count, not a limiter window

```
Problem: the readers generate limit is NOT an express-rate-limit window — it is a DB-backed count
        (`ReadersService.checkRateLimits` → `countUserGeneratedToday`, UTC-midnight reset) plus a
        5-passage storage cap, and it must reproduce the 429 `RATE_LIMIT` envelope exactly. The
        story plan's "shared WordRepository" wording suggested the counts might live elsewhere —
        they don't.
Root Cause: the rate limit is enforced in the SERVICE layer against the readers repository's own
        DB counts, not at the HTTP middleware layer; the only express-rate-limit surface on the
        readers module is the GET limiters on the two passage routes.
Solution: reproduced as-is — `checkRateLimits` (unchanged) → `ReadersRepository.countUserGeneratedToday`
        (DB-backed, UTC midnight) + `countUserGenerated` (storage cap), `READERS_DAILY_GENERATION_LIMIT
        = 5` declared in rate-limit.config.ts, and the Nest controller maps `RateLimitExceededError` →
        429 `RATE_LIMIT` (24-3 envelope). The parity harness proves the 429 on a user with 5 rows
        already generated today, asserting NO Gemini call on the blocked request (the rate-limit
        short-circuits before generation).
Impact: the 5/day generation limit is contract-identical on the shell (429 + envelope), the storage
        cap is preserved, and the rate-limit check still short-circuits billable Gemini generation.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — all 11 readers routes = `readersPassages` (`GET`), `readersPassageById` (`GET`), `readersGenerate` (`POST`), `readersPassageAudioById` (`POST`), `readersSessionByPassageId` (`GET`+`PUT`), `readersSessionCompleteByPassageId` (`POST`), `readersBookmarks` (`GET`+`POST`), `readersBookmarkByPassageId` (`DELETE`+`GET`); `/api` prefix applied by the shell
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `ReadersModule`/`ReadersNestController`/`ReadersRepository`/`ReadersService`/`SegmenterService`/`PassageGenerationService`/`ReadersAudioService`/`PassagePathHelpers`/`AUDIO_PASSAGE_PATHS`/`READERS_DAILY_GENERATION_LIMIT` copied from the shipped `modules/readers/nest/**`, `modules/audio/nest/audio.module.ts`, `nest/rate-limit.config.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — readers is DB-backed via the shared Prisma singleton (`ReadersRepository.countUserGeneratedToday`/`countUserGenerated`/`findPassages`/`findPassageById`/`upsertSession`/bookmarks) + Gemini (`PassageGenerationService`) + GCS/TTS (`ReadersAudioService` via `AudioService`); the parity harness registers real users via Express `/auth/register` and module-mocks GCS/TTS for the audio paths (DB-gated via `checkDatabase`)
- [x] All relative markdown links resolve (sibling story BRs 24-3/24-4/24-5/24-10/24-11 exist; the epic BR README exists; the IMP twin path resolves)
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Controller unit tests** (`src/modules/readers/nest/__tests__/readers-nest-controller.test.ts`, **38 tests**) — `ReadersService` mocked (no real DB/Gemini/GCS); each of the 11 routes exercised directly (decorators inert on direct calls; guard semantics are proven in the integration harness): success + delegation shapes (list/get/audio/generate/sessions/complete/bookmarks/delete), validation/error mapping — 400 `VALIDATION_ERROR` (hskLevel out-of-range + non-numeric, empty/oversized topic, missing/non-string passageId, negative/non-integer/non-number currentSentence), 404 `NOT_FOUND` (missing passage), 401 `AUTH_ERROR` (defensive `req.userId`-less requests on user-scoped routes), 429 `RATE_LIMIT` (DB-backed 5/day hit), 502 `GENERATION_ERROR` (Gemini failure), 500 `INTERNAL_ERROR`/`LOAD_ERROR`; `formatPassageResponse` date serialization (ISO strings + `lastAccessedAt ?? null` + `content` stripped); `hskLevel`/`topic`/`currentSentence` coercion.
- **`ReadersAudioService.test.ts` (updated)** — the existing suite now constructs the service with the real `passageHashFor`/`passagePath` helpers (hash determinism preserved via the mocked `hashUtils.computeHash`), exercising the new two-arg constructor.
- **DB-gated parity harness** (`tests/integration/nest/readers-parity.test.ts`, **28 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` on a missing DB. Real users registered via the Express `/auth/register` endpoint (rows cleaned in `afterAll`); mocked-GCS audio paths (shared `vi.fn()`s so both apps get the same deterministic fakes); unique TEST-NET-3 `X-Forwarded-For` IPs per request so no limiter ever trips. Coverage:
  - **passage reads (7)**: list 200 deep-equal (guest sees seeded passages) · filtered `?hskLevel=1` 200 · `?hskLevel=99` → 400 `VALIDATION_ERROR` envelope · get `:id` 200 formatted deep-equal (segmented + enriched, dates normalized) · nonexistent id → 404 `NOT_FOUND` · audio guest cache HIT → 200 `{ audioUrls }` deep-equal, `source: "gcs"`, NO billable generation (**F5 cache-first-free-for-guests**) · audio guest cache MISS → 200 `{ audioUrls }`, `source: "ondemand"` (generation allowed today; counter-gated in 29) · nonexistent id/audio → 404.
  - **guest 401s (3)**: generate · sessions · bookmarks → 401 `AUTH_REQUIRED` parity, **no passage written** on the generate attempt.
  - **generate (6)**: 201 deep-equal (sequential, deterministic core + normalized dates) · read-back of the generated passage 200 deep-equal on both apps · empty topic → 400 · >100-char topic → 400 · **5/day 429 `RATE_LIMIT` envelope parity with NO Gemini call** (5 rows already generated today).
  - **sessions (5)**: get-or-create 200 deep-equal · PUT position 200 deep-equal · invalid `currentSentence` → 400 · complete 200 deep-equal (idempotent) · session after complete shows `isCompleted: true`.
  - **bookmarks (7)**: fresh-user empty list 200 · add 201 deep-equal · missing `passageId` → 400 · list now shows the added bookmark · by-passage check bookmarked 200 · DELETE 204 parity (idempotent) · by-passage check un-bookmarked 200.
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` ✅ **704 tests (was 666; +38 unit)** · `test:integration` ✅ **231 tests (was 203; +28 parity)** · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke ✅ (passage-audio POST 200 with **real GCS signed URLs** — proving `AudioModule` DI end-to-end on the live shell; guest generate → 401 `AUTH_REQUIRED`).
