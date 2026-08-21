**Last Updated:** August 21, 2026

# Implementation 24-10: Audio + Health Port

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-10-audio-health-port.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `60f87f30`

## Implementation Summary

Ported the `audio` module (**`POST /v1/tts`**) and the `health` module (**`GET /v1/health`**) from Express to the NestJS 11 shell under `apps/backend/src/modules/<name>/nest/` — audio is the first `SharedModule` consumer after the zero-dep pair, health is the port that **resolves the direct `modules/audio` cross-module import via Nest DI**.

**Audio — `POST /v1/tts` verbatim with the calibrated `OptionalAuthGuard` (`audio.module.ts` + `audio-nest.controller.ts`).** `AudioModule` imports `SharedModule` (for `CacheService`/`GCSClient`/`GoogleTTSClient` + the `AUDIO_CONFIG_TOKEN` the controller reads for the voice default) and `GuardsModule` (for the calibrated `OptionalAuthGuard`), and provides `AudioService` via `useFactory(CacheService, GCSClient, GoogleTTSClient)` — wiring the SAME framework-agnostic facade the Express `app/container.ts` constructs (`new AudioService(cacheService, gcsClient, ttsClient)`), unchanged (it composes `AudioSynthesizer`/`AudioPathCache`/`AudioUrlSigner` internally). **`AudioService` is EXPORTED so the Health module can consume it via module-to-module Nest DI.** `AudioNestController` (`@Controller("v1/tts")`) mirrors `api/AudioController.ts` verbatim: the same `{ text, voice = audioConfig.voiceDefault }` body read, the same `AudioService.getTtsUrl(text, voice)` delegation, the same 2xx `{ audioUrl, cached }`, with **`@HttpCode(200)`** (fixing Nest's POST default 201 — the parity fix) and **`@UseGuards(OptionalAuthGuard)`** (the calibrated F5/F6 semantics). The `body ?? {}` guard degrades the no-body edge to the service's clean 400 `VALIDATION_ERROR` ("Text is required.") instead of Express's absent-body 500.

**Health — the full-`@Res()` mirror + the cross-module-import fix (`health.module.ts` + `health-nest.controller.ts`).** `HealthModule` imports `SharedModule` (for `GeminiService`) **and `AudioModule`** — the module-to-module DI that replaces the Express `modules/health/container.ts`'s direct `../../modules/audio/index.js` import (NO direct cross-module barrel import in Nest land) — and provides `RedisClient` locally via `useFactory: () => redisClient` (a value provider over the existing shared singleton, mirroring the Express `container.ts` raw-client wiring). `HealthNestController` (`@Controller("v1/health")`) is a **full `@Res()` mirror** of `HealthController.ts`: the same 200 shape `{ status, timestamp, uptime, services: { gemini, tts }, cache: { redis: { connected } } }` (written via `res.status(200).json(...)`) and the same 500 branch `{ error, code: "HEALTH_CHECK_FAILED", message }` written directly (the 24-3 filter would otherwise re-wrap it into the `{ code, message, requestId }` envelope). The `AudioService` is injected via `@Inject(AudioService)` with the constructor param **typed structurally** `{ healthCheck(): Promise<boolean> }` — exactly like the Express `HealthController` constructor — so even the type import never crosses the `modules/audio` barrel in Nest land. Redis health mirrors the Express `container.ts` `redisPing` wiring (`redisClient.getClient()` or the `NO_REDIS` fallback ping, `connected: true` iff `ping(5000)` resolves).

**Calibrated TTS F5 (verified in-port by the parity harness).** Guest (no/bad token) → `OptionalAuthGuard` leaves `req.userId` undefined, **never 401s**; a GCS cache HIT returns the signed URL with `{ cached: true }` and **NO billable generation** (`synthesizeSpeech` not called — the F5 "cache-first-free-for-guests" contract); registered → authed 2xx. Guest cache-MISS keeps the verbatim behavior today; guest-visible generation is **counter-gated with the mechanics deferred to epic-29** (no counter ships here).

**Verification results (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 61 files / 659 tests (**+2 files / +10 unit**: the audio + health controller unit suites) · `test:integration` ✅ 20 files / 191 tests (**+1 file / +11**: the audio-health parity suite) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (health 200 exact shape · tts pinyin → 400 `VALIDATION_ERROR` · no external calls). Pre-existing `ERR_ERL_KEY_GEN_IPV6` stderr noise (words/readers keyGenerators, 24-3/24-12 configs) is non-fatal and **not introduced by this story**.

## Technical Scope

Port the `audio` module (`POST /v1/tts`) and the `health` module (`GET /v1/health`) to the NestJS 11 shell with contract-identical behavior: an `AudioModule` (imports `SharedModule` + `GuardsModule`; `AudioService` via `useFactory(CacheService, GCSClient, GoogleTTSClient)`; **exports `AudioService`**) with a verbatim `AudioNestController` (`@HttpCode(200)` + calibrated `OptionalAuthGuard` + `audioConfig` via `AUDIO_CONFIG_TOKEN`), and a `HealthModule` (imports `SharedModule` + `AudioModule`; local `RedisClient` provider) with a full-`@Res()` mirror `HealthNestController` that resolves the Express health wiring's direct `modules/audio/index.js` import via Nest DI, plus unit tests (audio 5 + health 5) and a dedicated mocked-GCS parity harness (11 tests). The Express audio/health wiring is untouched.

**Files:**

- `apps/backend/src/modules/audio/nest/audio-nest.controller.ts` — **NEW**: `AudioNestController` (`@Controller("v1/tts")`) — `POST /v1/tts` verbatim mirror of `api/AudioController.ts` (`{ text, voice = audioConfig.voiceDefault }` → `AudioService.getTtsUrl` → `{ audioUrl, cached }`), `@HttpCode(200)` (Nest POST default 201 fix), `@UseGuards(OptionalAuthGuard)` (calibrated F5/F6), `audioConfig` injected via `AUDIO_CONFIG_TOKEN`.
- `apps/backend/src/modules/audio/nest/audio.module.ts` — **NEW**: `AudioModule` — imports `SharedModule` + `GuardsModule`; `AudioService` via `useFactory(CacheService, GCSClient, GoogleTTSClient)`; **`exports: [AudioService]`** for Health DI.
- `apps/backend/src/modules/audio/nest/__tests__/audio-nest-controller.test.ts` — **NEW**: unit tests (5) — mocked `AudioService`; default-voice + explicit-voice delegation, undefined-body → service 400 (never 500), 400/500 error propagation unchanged (no re-classification).
- `apps/backend/src/modules/health/nest/health-nest.controller.ts` — **NEW**: `HealthNestController` (`@Controller("v1/health")`) — full `@Res()` mirror of `HealthController.ts` (same 200 shape + same 500 `{ error, code: "HEALTH_CHECK_FAILED", message }` branch); injects `GeminiService` (SharedModule), `AudioService` (AudioModule DI, typed structurally `{ healthCheck(): Promise<boolean> }`), `RedisClient` (local provider).
- `apps/backend/src/modules/health/nest/health.module.ts` — **NEW**: `HealthModule` — imports `SharedModule` + **`AudioModule`** (module-to-module DI replacing the Express `health/container.ts` direct `modules/audio/index.js` import); `RedisClient` provided locally via `useFactory: () => redisClient`.
- `apps/backend/src/modules/health/nest/__tests__/health-nest-controller.test.ts` — **NEW**: unit tests (5) — stubbed `@Res()`; healthy/degraded services, Redis connected/disconnected/null-client (fallback), 500 `HEALTH_CHECK_FAILED`.
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import + register `AudioModule` and `HealthModule` (both mount at the top of the Express `routes.ts` — health L49, audio L64; import order immaterial here, no overlapping prefixes).
- `apps/backend/tests/integration/nest/audio-health-parity.test.ts` — **NEW**: DB-gated parity harness (11 tests: TTS 9 + health 2) — boots the real Express app + real Nest `AppModule`; module-mocks `GCSClient`/`GoogleTTSClient`/`GeminiService` (shared `vi.fn()`s) + Redis ping spy ("PONG"); real user registered via Express `/auth/register` for the authed-TTS surface.

## Implementation Details

### AudioModule — 1:1 of the Express audio wiring, `AudioService` exported

```typescript
// apps/backend/src/modules/audio/nest/audio.module.ts
@Module({
  imports: [SharedModule, GuardsModule],
  controllers: [AudioNestController],
  providers: [
    {
      provide: AudioService,
      useFactory: (cacheService: CacheService, gcsClient: GCSClient, ttsClient: GoogleTTSClient) =>
        new AudioService(cacheService, gcsClient, ttsClient),
      inject: [CacheService, GCSClient, GoogleTTSClient],
    },
  ],
  exports: [AudioService],
})
export class AudioModule {}
```

Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop; the compiled tsc build gets metadata for free. `SharedModule` supplies `CacheService`/`GCSClient`/`GoogleTTSClient` + the `AUDIO_CONFIG_TOKEN`; `GuardsModule` supplies the calibrated `OptionalAuthGuard` (+ its `JwtService`). **`exports: [AudioService]`** is the load-bearing piece — it is what lets `HealthModule` consume the facade via Nest DI. The `AudioService` facade itself is reused **unchanged** (it composes `AudioSynthesizer`/`AudioPathCache`/`AudioUrlSigner` internally — the Express path-cache + URL-signing behavior is identical by construction).

### AudioNestController — the verbatim TTS mirror + the `@HttpCode(200)` parity fix

```typescript
// apps/backend/src/modules/audio/nest/audio-nest.controller.ts
@Controller("v1/tts")
export class AudioNestController {
  constructor(
    @Inject(AudioService) private readonly audioService: AudioService,
    @Inject(AUDIO_CONFIG_TOKEN) private readonly audioConfigValue: typeof audioConfig,
  ) {}

  @Post()
  @HttpCode(200) // mirrors the Express `res.status(200).json(...)` — Nest's POST default 201
  @UseGuards(OptionalAuthGuard) // calibrated F5/F6: guest → req.userId undefined, never 401
  async getTtsAudio(
    @Body() body: { text?: string; voice?: string },
    @Req() req: Request,
  ): Promise<{ audioUrl: string; cached: boolean }> {
    const { text, voice = this.audioConfigValue.voiceDefault } = body ?? {};
    void req.userId; // read (not branched on) — surfaces the calibrated guest-vs-user distinction
    const { audioUrl, cached } = await this.audioService.getTtsUrl(text as string, voice);
    return { audioUrl, cached };
  }
}
```

The controller mirrors `AudioController.ts` 1:1 — same body read, same `getTtsUrl` delegation, same 2xx `{ audioUrl, cached }`. **`@HttpCode(200)`** is the status-parity fix: Nest's POST default is **201**, Express sends `res.status(200).json(...)` — without the decorator the shell would return 201 and break status parity. The `body ?? {}` guard is an additive hardening (the Express destructure 500s on an absent body-parser run; here it degrades to the service's clean 400 `VALIDATION_ERROR` "Text is required."). Errors propagate unchanged — `validationError` → 400 `VALIDATION_ERROR`, `ttsError` → 500 `TTS_ERROR` — serialized by the global 24-3 `AppExceptionFilter`, matching `errorHandler.ts`.

### HealthModule — the cross-module-import fix (module-to-module Nest DI)

```typescript
// apps/backend/src/modules/health/nest/health.module.ts
@Module({
  imports: [SharedModule, AudioModule], // ← AudioModule — NOT modules/audio/index.js
  controllers: [HealthNestController],
  providers: [
    { provide: RedisClient, useFactory: () => redisClient },
  ],
})
export class HealthModule {}
```

The Express `modules/health/container.ts` imports `AudioServiceLike` from `../../modules/audio/index.js` — a **direct cross-module barrel import**. `HealthModule` replaces it with module-to-module injection: it imports `AudioModule` (which exports `AudioService`) and the controller injects the exported service via `@Inject(AudioService)`. The constructor param is **typed structurally** `{ healthCheck(): Promise<boolean> }` (the same structural `AudioHealthLike` type the Express `HealthController` ctor uses) so no `modules/audio` barrel — value OR type — is ever imported from health Nest land.

### HealthNestController — the full-`@Res()` mirror

```typescript
// apps/backend/src/modules/health/nest/health-nest.controller.ts
@Controller("v1/health")
export class HealthNestController {
  constructor(
    @Inject(GeminiService) private readonly geminiService: { healthCheck(): Promise<boolean> },
    @Inject(AudioService) private readonly audioService: AudioHealthLike, // structural { healthCheck() }
    @Inject(RedisClient) private readonly redisClient: RedisClient,
  ) {}

  @Get()
  async checkHealth(@Res() res: Response): Promise<void> {
    try {
      const base = createHealthResponse();
      const geminiOk = await this.geminiService.healthCheck().catch(() => false);
      const audioOk = await this.audioService.healthCheck().catch(() => false);
      const rawClient = this.redisClient.getClient();
      const redisPing = (rawClient ?? { ping: async () => "NO_REDIS" }) as {
        ping(timeout?: number): Promise<string>;
      };
      let redisHealthy = false;
      try {
        await redisPing.ping(5000);
        redisHealthy = true;
      } catch (error) {
        logger.warn("Redis health check failed", { error: ... });
        redisHealthy = false;
      }
      res.status(200).json({ ...base, services: { gemini: geminiOk, tts: audioOk },
        cache: { redis: { connected: redisHealthy } } });
    } catch (error) {
      logger.error("Health check failed", { error: ... });
      res.status(500).json({ error: "Internal Server Error", code: "HEALTH_CHECK_FAILED",
        message: "Failed to perform health check" });
    }
  }
}
```

Full `@Res()` control (like the radicals `200 null` port): the 200 body is written with `res.status(200).json(...)` and the catch branch writes the Express `{ error, code, message }` shape directly — the global `AppExceptionFilter` would otherwise re-wrap the 500 into the `{ code, message, requestId }` envelope, which is NOT what the Express health endpoint emits. Redis health mirrors the Express `container.ts` `redisPing` wiring byte-for-byte (raw client `getClient()` or the `NO_REDIS` fallback ping, `connected: true` iff `ping(5000)` resolves without throwing).

### The parity harness — hermetic mocked-GCS proof

`tests/integration/nest/audio-health-parity.test.ts` boots both the production Express app and the real Nest `AppModule` in-process via supertest. Every external client is module-mocked with **`vi.hoisted` mock classes** (`MockGCSClient`/`MockGoogleTTSClient`/`MockGeminiService`) whose methods delegate to **shared `vi.fn()`s** — so the Express `app/container.ts` and the Nest `SharedModule` construct the **same deterministic fakes** (the classes are both what the mocks replace and what the DI factories instantiate). The raw ioredis `ping` is spied to resolve "PONG" (deterministic, no real network). A **real user is registered via the Express `/auth/register`** endpoint for the authed-TTS surface (both apps share the DB + JWT secret, so the token authenticates on both); the user/session rows are cleaned up in `afterAll`. The suite is DB-gated (`describe.skipIf(!db.available)`) and uses unique `X-Forwarded-For` IPs (TEST-NET-3) so no limiter ever trips.

## Architecture Integration

```
[Story 24-10: Audio + Health Port]
├── modules/audio/nest/audio.module.ts — imports SharedModule + GuardsModule; AudioService
│     via useFactory(CacheService, GCSClient, GoogleTTSClient); EXPORTS AudioService
├── modules/audio/nest/audio-nest.controller.ts — POST /v1/tts verbatim mirror; @HttpCode(200)
│     + calibrated OptionalAuthGuard; audioConfig via AUDIO_CONFIG_TOKEN; 2xx { audioUrl, cached }
├── modules/audio/nest/__tests__/audio-nest-controller.test.ts — 5 unit tests (mocked service)
├── modules/health/nest/health.module.ts — imports SharedModule + AudioModule (module-to-module
│     DI); RedisClient local useFactory provider
├── modules/health/nest/health-nest.controller.ts — GET /v1/health full-@Res() mirror (200 shape
│     + 500 {error, code: HEALTH_CHECK_FAILED, message}); injects GeminiService (SharedModule) +
│     AudioService (AudioModule DI, structural { healthCheck() }) + RedisClient
├── modules/health/nest/__tests__/health-nest-controller.test.ts — 5 unit tests (stubbed @Res())
├── nest/app.module.ts — UPDATE: imports AudioModule + HealthModule (no prefix overlap with the
│     existing modules)
├── tests/integration/nest/audio-health-parity.test.ts — DB-gated parity harness (11 tests:
│     TTS 9 + health 2) — mocked GCS/TTS/Gemini (shared vi.fn()s) + Redis ping spy ("PONG") +
│     real user via Express /auth/register
├── Express modules/audio|health (container.ts, api/*) — UNTOUCHED (production surface until
│     24-15 cutover; health/container.ts keeps its direct modules/audio/index.js import there)
└── Dependencies: 24-3 (envelope) · 24-4 (SharedModule substrate) · 24-5 (calibrated guards)
```

Dependencies: **24-3** (the `{ code, message, requestId }` envelope the TTS 4xx/5xx inherit), **24-4** (`SharedModule` — `CacheService`/`GCSClient`/`GoogleTTSClient` + `AUDIO_CONFIG_TOKEN`), **24-5** (the calibrated `OptionalAuthGuard`). Parallel-safety: **additive** — the Express audio/health wiring is untouched; **no** `packages/shared-constants` / `packages/shared-types` / FE change; **no** 25–28 collision-zone file touched. Consumer: **24-12 (readers)** — `ReadersAudioService` will consume the Nest-injected `AudioService` for passage-audio with the same calibrated F5 semantics (this story establishes the `AudioModule` export pattern it relies on).

## Technical Challenges & Solutions

### The Health↔Audio cross-module import — resolved via module-to-module Nest DI

```
Problem: the Express health wiring has a DIRECT cross-module barrel import —
        modules/health/container.ts does `import type { AudioServiceLike } from
        "../../modules/audio/index.js"`. Porting health to the Nest shell naively
        (re-importing AudioServiceLike from the audio barrel) would carry that
        cross-module dependency into Nest land, violating the module-boundary
        discipline the shell has maintained so far.
Root Cause: health needs the audio facade's `healthCheck()` but is a separate module;
        the Express DI container (app/container.ts) wires both and passes the instance
        in, so the direct import only appears at the container boundary. Nest's module
        system has a first-class mechanism for exactly this: a module EXPORTS a provider
        and another module IMPORTS it.
Solution: `AudioModule` exports `AudioService` (`exports: [AudioService]`); `HealthModule`
        imports `AudioModule` and `HealthNestController` injects the exported service via
        `@Inject(AudioService)`. The constructor param is typed structurally
        (`{ healthCheck(): Promise<boolean> }`, the same `AudioHealthLike` shape the
        Express `HealthController` ctor uses) — so NO `modules/audio/index.js` import,
        value OR type, exists anywhere in Nest land. `check:module-boundaries` stays green.
Impact: the shell's first module-to-module DI edge is proven; every later audio consumer
        (24-12 readers) and any future cross-module dependency uses the same pattern.
```

### `@HttpCode(200)` vs the Nest POST default 201 — status-parity fix

```
Problem: Express `AudioController.getTtsAudio` sends `res.status(200).json({ audioUrl,
        cached })` — a 200. A straightforward Nest POST handler returns 201 by default
        (Nest's convention for POST), so a naive port would silently break status
        parity on every successful TTS call (201 vs 200).
Root Cause: Nest's `@Post()` route status default is 201 Created; the Express controller
        explicitly sets 200. The parity harness asserts status equality, so the mismatch
        would fail the suite.
Solution: `@HttpCode(200)` on the `getTtsAudio` handler pins the response status to 200,
        a byte-for-byte match of the Express `res.status(200)`. (Same class of fix as the
        radicals `200 null` `@Res()` mirror in 24-9 — Nest defaults that differ from the
        Express wire contract must be overridden explicitly.)
Impact: TTS status parity is exact; the harness pins it (2xx status deep-equal on the
        guest HIT/MISS + authed paths).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `ttsAudio` (`POST /v1/tts`) and `health` (`GET /v1/health`), `/api` prefix applied by the shell
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `AudioModule`/`AudioNestController`/`AudioService`/`AudioSynthesizer`/`AudioPathCache`/`AudioUrlSigner`/`HealthModule`/`HealthNestController`/`AUDIO_CONFIG_TOKEN` copied from the shipped `modules/audio/nest/**`, `modules/health/nest/**`, `nest/app.module.ts`, `nest/shared/shared.module.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — audio/health are external-client + cache + Redis surfaces, no Prisma reads; the parity harness module-mocks `GCSClient`/`GoogleTTSClient`/`GeminiService` and spies the Redis ping ("PONG"); a real user is registered via Express `/auth/register` only to exercise the authed-TTS surface (DB-gated via `checkDatabase`)
- [x] All relative markdown links resolve (sibling story BRs 24-3/24-4/24-5 exist; the epic README exists)
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Controller unit tests** (`src/modules/audio/nest/__tests__/audio-nest-controller.test.ts`, **5 tests**) — `AudioService` mocked (no real GCS/TTS/Redis); the controller is exercised directly (decorators inert on direct calls; `OptionalAuthGuard` semantics are proven in the integration harness): default-voice delegation (`{ text, voice = voiceDefault }` → `getTtsUrl(text, voiceDefault)`), explicit-voice pass-through, undefined-body → service 400 (never a 500), service validation error (400) propagated unchanged, upstream TTS error (500) propagated unchanged — no re-classification.
- **Health controller unit tests** (`src/modules/health/nest/__tests__/health-nest-controller.test.ts`, **5 tests**) — `GeminiService`/audio `healthCheck` + the Redis ping mocked; a stub `@Res()` response: 200 `{ status: "ok", services: { gemini, tts }, cache: { redis: { connected } } }` with ISO `timestamp` + numeric `uptime`, degraded external services (`false`), Redis disconnected (ping rejects), null Redis client → connected (the Express `NO_REDIS` fallback), and the 500 `{ error, code: "HEALTH_CHECK_FAILED", message }` branch (via a poisoned `Date`).
- **DB-gated parity harness** (`tests/integration/nest/audio-health-parity.test.ts`, **11 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` on a missing DB. Hermetic: `vi.hoisted` mock classes for `GCSClient`/`GoogleTTSClient`/`GeminiService` (shared `vi.fn()`s so both the Express container + Nest `SharedModule` get the same deterministic fakes), ioredis ping spied → "PONG", real user registered via Express `/auth/register` for the authed-TTS surface (rows cleaned in `afterAll`), unique TEST-NET-3 `X-Forwarded-For` IPs per request. Coverage:
  - **audio / TTS (9)**: guest cache HIT → 200 `{ audioUrl, cached: true }` + `synthesizeSpeech` NOT called (**F5 cache-first-free-for-guests**) · guest cache MISS → 200 `{ cached: false }` (generation allowed today; counter-gated in epic-29) · registered cache HIT → 200 same shape (authenticated) · invalid token → STILL 200 as guest (F6 bad-token-as-guest, never 401) · empty text → 400 `VALIDATION_ERROR` "Text is required." · pinyin (`bā`) → 400 `VALIDATION_ERROR` Hanzi guard · too many words → 400 `VALIDATION_ERROR` · upstream TTS failure → 500 `TTS_ERROR` · GCS signing failure on cache hit → 500 `TTS_ERROR` (all 4xx/5xx as full `{ code, message, requestId }` deep-equal with the echoed `X-Request-Id`).
  - **health (2)**: 200 — same shape as Express (timestamp/uptime normalized; `status`/`services`/`cache` deep-equal) · 200 — exact key set matches Express (`cache`, `services`, `status`, `timestamp`, `uptime`; no extra/missing keys).
- **Cleanup**: `afterAll` deletes the registered user's session + user rows, clears the Redis ping spy, closes the Nest app, and disconnects the DB (the suite writes only the one test user).
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` 61/659 (+2 files / +10 unit) ✅ · `test:integration` 20/191 (+1 file / +11 parity) ✅ · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke (health 200 exact shape · tts pinyin → 400 `VALIDATION_ERROR` · no external calls) ✅. Pre-existing `ERR_ERL_KEY_GEN_IPV6` stderr noise (words/readers keyGenerators, 24-3/24-12 configs) — non-fatal, not introduced here.
