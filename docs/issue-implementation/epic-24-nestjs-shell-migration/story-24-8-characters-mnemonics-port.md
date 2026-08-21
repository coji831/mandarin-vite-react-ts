**Last Updated:** August 21, 2026

# Implementation 24-8: Characters + Mnemonics Port

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-8-characters-mnemonics-port.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `0c076cb0`

## Implementation Summary

Ported the `characters` module (two controllers, 7 routes) and the `mnemonics` module (4 routes) from Express to the NestJS 11 shell under `apps/backend/src/modules/<name>/nest/`. Characters is the first **two-controller** module port; mnemonics is the **first consumer** of the shared infra (`SharedModule` cache + gemini, 24-4) and of the **calibrated `OptionalAuthGuard`** (24-5) on the shell.

**Characters — a two-controller module with route-shadowing parity (`characters.module.ts` + `characters-nest.controller.ts` + `pinyin-nest.controller.ts`).** `CharactersModule` registers TWO controllers — `CharactersNestController` (`@Controller("v1/characters")`, 6 routes: `:glyph`, `:glyph/phonetic`, `:glyph/homophones`, `:glyph/decomposition`, `/search`, `/frequency`) and `PinyinNestController` (`@Controller("v1/pinyin")`, `GET /search`) — with 4 explicit `useFactory` providers: `CharactersRepository`, `PinyinSearchRepository` (both self-import the shared Prisma singleton, matching the `words` port in 24-2 — characters are public static data, so no `SharedModule`), `CharactersService`, and `PinyinSearchService`. Both controllers reuse the framework-agnostic services unchanged and mirror the Express controllers 1:1, including the same CJK regex (`CHINESE_CHAR_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]$/`) and the same `code`/`message` 4xx bodies.

**Route-shadowing parity note (pre-existing latent, reproduced byte-for-byte):** `:glyph` is declared FIRST exactly as in `charactersRoutes.ts`. On both apps (Express and Nest — both match in registration order via path-to-regexp), `GET /v1/characters/search` and `GET /v1/characters/frequency` are matched by the `:glyph` handler BEFORE the literal `/search` / `/frequency` routes, returning 400 `VALIDATION_ERROR` "Invalid character glyph". This is a pre-existing latent behavior on the live Express app (no frontend consumer calls those two paths today — the FE uses `/v1/pinyin/search`); the `/search` + `/frequency` handlers are still ported (declared after `:glyph`, so they shadow identically) and their underlying 2xx logic is covered by the `CharactersService` unit tests. `pinyinRoutes.ts` registers ONLY `/search` (no `:glyph` sibling), so `GET /v1/pinyin/search` is **not** shadowed and returns a real 2xx. (A second, cross-module shadowing layer exists on the LIVE Express app — the FOUNDATIONS module's `characters/:glyph` route, mounted before characters in `app/routes.ts`, owns the single-segment `GET /v1/characters/:glyph`; parity for that path is deferred to 24-9 when foundations is ported — see Technical Challenges.)

**Mnemonics — first SharedModule consumer + calibrated optional-auth (`mnemonics.module.ts` + `mnemonics-nest.controller.ts`).** `MnemonicsModule` imports `SharedModule` (24-4) for `GeminiService` + `CacheService` and `GuardsModule` (24-5) so the calibrated `OptionalAuthGuard`/`RequireAuthGuard` (and their `JwtService` dependency) resolve in the controller's `@UseGuards(...)` context. Providers: `MnemonicsRepository` via `useFactory`, and `MnemonicsService` via `useFactory` injecting the SAME three deps the Express `createMnemonicsModule(deps)` container factory takes — `MnemonicsRepository` + `GeminiService` + `CacheService`. The controller mirrors `MnemonicsController.ts` 1:1:

| Route (with `/api` prefix)        | Verb   | Guard                                             | Status                   |
| --------------------------------- | ------ | ------------------------------------------------- | ------------------------ |
| `/v1/mnemonics/:character`        | GET    | `@UseGuards(OptionalAuthGuard)` (24-5 calibrated)  | 200 `{ mnemonic }` / `{ mnemonic: null }` |
| `/v1/mnemonics/:character`        | POST   | `@UseGuards(RequireAuthGuard)`                     | 201 (`@HttpCode`)        |
| `/v1/mnemonics/:character`        | PUT    | `@UseGuards(RequireAuthGuard)`                     | 200                      |
| `/v1/mnemonics/:character`        | DELETE | `@UseGuards(RequireAuthGuard)`                     | 204 (`@HttpCode`)        |

**Calibrated guest behavior (verified):** on GET, `OptionalAuthGuard` leaves `req.userId` **undefined** for a guest (never 401). `getMnemonic(character, userId?)` passes that through to the service's 4-step lookup chain (user-edited → cache(AI) → DB(AI) → generate): `if (userId) { … user-edited branch … }` — so a guest skips step 1 entirely and returns only shared/cached/static data. The harness proves a guest GET on a glyph that HAS a user-edited story still returns `{ mnemonic: null }` — never another user's rows, never all-unlocked (F6 calibrated semantics). The controller's own `!userId → 401 AUTH_ERROR` defense-in-depth branches on the write routes (mirroring the Express controller, which double-checks `req.userId` after `requireAuth`) are unreachable under `RequireAuthGuard` but kept structurally. Validation parity: `HAN_CHAR_REGEX = /^[\u4e00-\u9fff]$/`, `MAX_STORY_LENGTH = 1000`, `radicalIds` array-of-strings check, and PUT HTML sanitization (`story.replace(/<[^>]*>/g, "")`) — all byte-for-byte with the Express controller.

**Per-method rate limiters, 1:1 with `mnemonicsRoutes.ts` (`rate-limit.config.ts` + `configure-app.ts`):** `MNEMONICS_GET_LIMITER_CONFIG` (60/min), `MNEMONICS_GENERATE_LIMITER_CONFIG` (10/min), `MNEMONICS_UPDATE_LIMITER_CONFIG` (30/min), `MNEMONICS_DELETE_LIMITER_CONFIG` (30/min) — each with the same `req.userId || ipKeyGenerator(req.ip || "unknown")` key (the `ipKeyGenerator` helper avoids express-rate-limit's `ERR_ERL_KEY_GEN_IPV6` warning) and the same per-method `message` objects. The `rateLimitMnemonics` dispatcher switches on `req.method` and is mounted path-scoped at `/api/v1/mnemonics` in `configure-app.ts` (running BEFORE the Nest guards, so the limiter keys by IP for everyone — a rate-limit KEY difference only, max-per-bucket unchanged; the harness uses unique `X-Forwarded-For` IPs per request so it never trips a limiter). The 429 body (default express-rate-limit handler sending the `message` object directly) is byte-identical to Express — no envelope, like the auth 429.

**Parity harness (`tests/integration/nest/characters-mnemonics-parity.test.ts`, 24 tests)** — a dedicated DB-gated suite following the established route-parity/auth-parity pattern: boots the real Express app (`src/app/index.ts`) + the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`), `describe.skipIf(!db.available)` on a missing DB. **No real Gemini/GCS is hit** — deterministic fixtures short-circuit the AI calls: pictograph characters (seed `classification: "pictograph"`, e.g. 丁) short-circuit both `getMnemonic` (step 4) and `generateMnemonic` (early return) to a static note; non-pictograph glyphs with no story → deterministic `{ mnemonic: null }`. A real user is registered via the Express app (both apps share the DB + JWT secret) for the write surface; PUT runs SEQUENTIALLY across the two apps (both upsert the same `(characterGlyph, userId)` row — a parallel create would race the `@@unique` constraint). Every mnemonics/register request sends a UNIQUE `X-Forwarded-For` from the documented TEST-NET-3 range so the per-method limiters never trip mid-suite. `afterAll` cleans up the mnemonic rows + user + sessions. Coverage: 6 characters deep-route parity tests + 3 Nest-only single-segment smokes (`:glyph` 200 characters shape, `abc` 400, `/search` + `/frequency` 400 shadow) + 3 pinyin tests (200, missing-q 400, invalid-tone 400) + 12 mnemonics tests (pictograph guest GET 200 static, plain guest GET `{ mnemonic: null }`, invalid 400, guest POST 401 `AUTH_REQUIRED`, authed invalid 400, pictograph authed POST 201, authed PUT 200 upsert, empty-story PUT 400, authed GET sees own story, guest GET never another user's story `{ mnemonic: null }`, authed DELETE 204, guest DELETE 401).

**Pre-existing boot noise (flagged, not from this story):** at boot, `ERR_ERL_KEY_GEN_IPV6` ValidationError stacks are logged for the **WORDS** limiters — the 24-3 configs (`WORDS_GET_LIMITER_CONFIG` / `WORDS_GUEST_GET_LIMITER_CONFIG`) use `keyGenerator: (req) => req.userId || req.ip || "unknown"` (raw `req.ip` without `ipKeyGenerator`). Non-fatal (caught + logged), pre-existing since 24-3, mirrors Express — flagged as a 24-3 follow-up. The 24-8 mnemonics configs are correct (`ipKeyGenerator(req.ip || "unknown")`).

**Verification results (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 59 files / 649 tests · `test:integration` ✅ 18 files / 166 tests (**+24**: the characters-mnemonics parity suite) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (`GET /api/v1/pinyin/search` 200 · `GET /api/v1/characters/好/phonetic` 404 envelope · mnemonics guest `GET` 200 static · guest `POST` 401 `AUTH_REQUIRED` · `GET /api/v1/characters/abc` 400 `VALIDATION_ERROR`).

## Technical Scope

Port the `characters` module (2 controllers, 7 routes) and the `mnemonics` module (4 routes) to the NestJS 11 shell with contract-identical behavior: a TWO-controller `CharactersModule` (6 characters routes + `PinyinNestController`) with 4 `useFactory` providers; a `MnemonicsModule` that is the first consumer of `SharedModule` (cache + gemini) + `GuardsModule` (calibrated `OptionalAuthGuard` on GET, `RequireAuthGuard` on POST/PUT/DELETE), per-method limiters (GET 60 / POST 10 / PUT 30 / DELETE 30) mounted path-scoped, and a dedicated DB-gated parity harness proving 2xx/4xx parity against the real Express app. The Express characters/mnemonics wiring is untouched.

**Files:**

- `apps/backend/src/modules/characters/nest/characters.module.ts` — **NEW**: `CharactersModule` — TWO controllers (`CharactersNestController` + `PinyinNestController`); 4 `useFactory` providers (`CharactersRepository`, `PinyinSearchRepository`, `CharactersService` injecting `CharactersRepository`, `PinyinSearchService` injecting `PinyinSearchRepository`); `exports: [CharactersService, PinyinSearchService]`; no `SharedModule` (public static data, repos self-import Prisma).
- `apps/backend/src/modules/characters/nest/characters-nest.controller.ts` — **NEW**: `CharactersNestController` (`@Controller("v1/characters")`) — 6 routes (`:glyph`, `:glyph/phonetic`, `:glyph/homophones`, `:glyph/decomposition`, `/search`, `/frequency`) with CJK-regex validation (`CHINESE_CHAR_REGEX`) + the `:glyph`-first route-shadowing parity note; 2xx/4xx `code`/`message` 1:1 with `CharactersController.ts`.
- `apps/backend/src/modules/characters/nest/pinyin-nest.controller.ts` — **NEW**: `PinyinNestController` (`@Controller("v1/pinyin")`) — `GET /search` (`q` required, `tone` 1–5), not shadowed; 1:1 with `PinyinController.ts`.
- `apps/backend/src/modules/mnemonics/nest/mnemonics.module.ts` — **NEW**: `MnemonicsModule` — `imports: [SharedModule, GuardsModule]`; `useFactory` providers (`MnemonicsRepository` + `MnemonicsService` injecting `MnemonicsRepository` + `GeminiService` + `CacheService`); `exports: [MnemonicsService]`.
- `apps/backend/src/modules/mnemonics/nest/mnemonics-nest.controller.ts` — **NEW**: `MnemonicsNestController` (`@Controller("v1/mnemonics")`) — GET → `OptionalAuthGuard` (guest → `req.userId` undefined → empty, F6), POST/PUT/DELETE → `RequireAuthGuard`; validation (`HAN_CHAR_REGEX`, `MAX_STORY_LENGTH`, `radicalIds` check) + PUT HTML sanitization parity; `@HttpCode(201)` on POST, `@HttpCode(204)` on DELETE.
- `apps/backend/src/modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts` — **NEW**: 18 unit tests — mocked service (no real Gemini/GCS/Redis): `getMnemonic` (5), `generateMnemonic` (5, incl. guest-pass-through `undefined` userId + AI-error → 503 + defense-in-depth 401), `updateMnemonic` (5, incl. sanitization + validation), `resetMnemonic` (3).
- `apps/backend/src/nest/rate-limit.config.ts` — **UPDATE**: add the 4 mnemonics limiters (`MNEMONICS_GET` 60 / `MNEMONICS_GENERATE` 10 / `MNEMONICS_UPDATE` 30 / `MNEMONICS_DELETE` 30) — `[APPLIED]`, key `req.userId || ipKeyGenerator(req.ip || "unknown")` — + the `rateLimitMnemonics` per-method dispatcher.
- `apps/backend/src/nest/configure-app.ts` — **UPDATE**: mount `rateLimitMnemonics` path-scoped at `/api/v1/mnemonics`.
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import `CharactersModule` + `MnemonicsModule` into the shell.
- `apps/backend/tests/integration/nest/characters-mnemonics-parity.test.ts` — **NEW**: DB-gated parity harness — real Express app vs real Nest `AppModule` (24 tests; deterministic pictograph fixtures short-circuit Gemini, unique `X-Forwarded-For`, PUT sequential, cleanup in `afterAll`).

## Implementation Details

### Two-controller module — `CharactersModule`

```typescript
// apps/backend/src/modules/characters/nest/characters.module.ts
@Module({
  controllers: [CharactersNestController, PinyinNestController], // TWO controllers
  providers: [
    { provide: CharactersRepository, useFactory: () => new CharactersRepository() },
    { provide: PinyinSearchRepository, useFactory: () => new PinyinSearchRepository() },
    {
      provide: CharactersService,
      useFactory: (repository: CharactersRepository) => new CharactersService(repository),
      inject: [CharactersRepository],
    },
    {
      provide: PinyinSearchService,
      useFactory: (repository: PinyinSearchRepository) => new PinyinSearchService(repository),
      inject: [PinyinSearchRepository],
    },
  ],
  exports: [CharactersService, PinyinSearchService],
})
export class CharactersModule {}
```

Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop; the compiled tsc build gets metadata for free. Repos self-import the shared Prisma singleton (same as the Express path), so no `SharedModule` is imported — characters are public static reference data.

### Route-shadowing parity — `:glyph` declared first

```typescript
// apps/backend/src/modules/characters/nest/characters-nest.controller.ts
@Controller("v1/characters")
export class CharactersNestController {
  @Get(":glyph") // declared FIRST — shadows /search + /frequency, exactly as charactersRoutes.ts
  async getCharacter(@Param("glyph") glyph: string): Promise<unknown> { /* … */ }

  @Get("search") // declared AFTER :glyph — matched by :glyph first on BOTH apps (400)
  async search(@Query("q") q?, @Query("tone") tone?, @Query("hskLevel") hskLevel?) { /* … */ }

  @Get("frequency") // declared AFTER :glyph — shadowed identically (400)
  async getFrequency(@Query("tier") tier?, @Query("page") page?, @Query("pageSize") pageSize?) { /* … */ }
}
```

`GET /v1/characters/search` + `/frequency` return 400 `VALIDATION_ERROR` "Invalid character glyph" on both apps (glyph = "search"/"frequency" fails the CJK regex) — a pre-existing latent Express behavior reproduced byte-for-byte for parity. The handlers are still ported (shadow identically) and their 2xx logic is covered by `CharactersService` unit tests. `GET /v1/pinyin/search` (in `PinyinNestController`) is NOT shadowed — `pinyinRoutes.ts` registers only `/search`.

### First SharedModule consumer — `MnemonicsModule`

```typescript
// apps/backend/src/modules/mnemonics/nest/mnemonics.module.ts
@Module({
  imports: [SharedModule, GuardsModule], // SharedModule → CacheService + GeminiService (24-4); GuardsModule → calibrated guards (24-5)
  controllers: [MnemonicsNestController],
  providers: [
    { provide: MnemonicsRepository, useFactory: () => new MnemonicsRepository() },
    {
      provide: MnemonicsService,
      useFactory: (repository, geminiService, cacheService) =>
        new MnemonicsService(repository, geminiService, cacheService), // same 3 deps createMnemonicsModule(deps) takes
      inject: [MnemonicsRepository, GeminiService, CacheService],
    },
  ],
  exports: [MnemonicsService],
})
export class MnemonicsModule {}
```

### Calibrated optional-auth — guest GET is empty, never another user's rows

```typescript
// apps/backend/src/modules/mnemonics/nest/mnemonics-nest.controller.ts
@Get(":character")
@UseGuards(OptionalAuthGuard) // 24-5 calibrated: guest → req.userId stays UNDEFINED (never 401)
async getMnemonic(@Param("character") character: string, @Req() req: Request): Promise<unknown> {
  const userId = req.userId as string | undefined; // undefined for a guest
  // … validate …
  const result = await this.mnemonicsService.getMnemonic(characterValue, userId);
  return { mnemonic: result }; // guest skips the user-edited branch → shared/static only
}
```

The service's 4-step lookup chain (`MnemonicsService.getMnemonic(characterGlyph, userId?)`) guards step 1 with `if (userId) { … findByCharacterAndUser(…, true) … }` — a guest (undefined) skips it, so a guest never sees another user's edited story (F6 calibrated semantics). The write routes use `@UseGuards(RequireAuthGuard)` (guest → 401 `AUTH_REQUIRED`, matching Express `requireAuth`), with the controller's own `!userId → 401 AUTH_ERROR` defense-in-depth branches kept to mirror the Express controller structure.

### Per-method limiters — 1:1 with `mnemonicsRoutes.ts`

```typescript
// apps/backend/src/nest/rate-limit.config.ts
export const MNEMONICS_GET_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, max: 60,
  keyGenerator: (req) => req.userId || ipKeyGenerator(req.ip || "unknown"), // ipKeyGenerator avoids ERR_ERL_KEY_GEN_IPV6
  message: { error: "Too many requests. Please wait a moment before fetching more mnemonics.", code: "RATE_LIMIT" },
  standardHeaders: true, legacyHeaders: false,
};
// … GENERATE 10 / UPDATE 30 / DELETE 30 …

export function rateLimitMnemonics(req, res, next) {
  switch (req.method) { // per-method dispatcher — mirrors mnemonicsRoutes.ts
    case "GET": mnemonicsGetLimiter(req, res, next); break;
    case "POST": mnemonicsGenerateLimiter(req, res, next); break;
    case "PUT": mnemonicsUpdateLimiter(req, res, next); break;
    case "DELETE": mnemonicsDeleteLimiter(req, res, next); break;
    default: next();
  }
}

// apps/backend/src/nest/configure-app.ts — mounted path-scoped
expressApp.use("/api/v1/mnemonics", rateLimitMnemonics);
```

## Architecture Integration

```
[Story 24-8: Characters + Mnemonics Port]
├── modules/characters/nest/characters.module.ts — TWO controllers (CharactersNestController +
│     PinyinNestController) + 4 useFactory providers (2 repos + 2 services); no SharedModule
├── modules/characters/nest/characters-nest.controller.ts — 6 routes (:glyph, /:glyph/phonetic,
│     /:glyph/homophones, /:glyph/decomposition, /search, /frequency) + CJK-regex validation +
│     :glyph-first route-shadowing parity note
├── modules/characters/nest/pinyin-nest.controller.ts — GET /v1/pinyin/search (not shadowed)
├── modules/mnemonics/nest/mnemonics.module.ts — FIRST SharedModule consumer (CacheService +
│     GeminiService via useFactory) + GuardsModule
├── modules/mnemonics/nest/mnemonics-nest.controller.ts — GET → OptionalAuthGuard (guest → userId
│     undefined → empty, F6); POST/PUT/DELETE → RequireAuthGuard; validation + HTML sanitization
├── modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts — 18 unit tests (mocked service)
├── nest/rate-limit.config.ts — 4 mnemonics limiters (GET 60 / POST 10 / PUT 30 / DELETE 30) + dispatcher
├── nest/configure-app.ts — mounts rateLimitMnemonics at /api/v1/mnemonics
├── nest/app.module.ts — imports CharactersModule + MnemonicsModule (shell surface)
├── tests/integration/nest/characters-mnemonics-parity.test.ts — DB-gated parity harness (24 tests)
├── Express modules/characters|mnemonics (container.ts + api/*) — UNTOUCHED
│     (production surface until 24-15 cutover)
└── Dependencies: 24-3 (envelope + rate-limit infra) · 24-4 (SharedModule cache/gemini) ·
      24-5 (calibrated OptionalAuthGuard/RequireAuthGuard + GuardsModule)
```

Dependencies: **24-3** (the `{code, message, requestId}` envelope + rate-limit infra), **24-4** (`SharedModule` — `CacheService` + `GeminiService` providers, first consumer), **24-5** (`OptionalAuthGuard`/`RequireAuthGuard` + `GuardsModule`, first consumer on a real module). Parallel-safety: **additive** — the Express characters/mnemonics wiring is untouched; **no** `packages/shared-constants` / `packages/shared-types` / FE change; **no** 25–28 collision-zone file touched. Consumer for **24-9**: foundations (whose `characters/:glyph` route currently shadows the characters module's single-segment `:glyph` on the live Express app — parity there lands when foundations is ported).

## Technical Challenges & Solutions

### Two-controller module + route-shadowing — pinyin `/search` vs characters `:glyph`

```
Problem: the characters surface needs TWO controllers (characters + pinyin) and reproduces a
        shadowing quirk exactly: GET /v1/characters/search and /frequency must return 400
        (glyph = "search"/"frequency" fails the CJK regex) because :glyph is declared first,
        while GET /v1/pinyin/search must return a real 2xx — three routes that LOOK alike
        (`/search`) but behave differently depending on their router's sibling routes.
Root Cause: in Express (and Nest — both match via path-to-regexp in registration order),
        `:glyph` shadows any later literal sibling under the same router. charactersRoutes.ts
        declares `:glyph` first, so `/search` + `/frequency` are shadowed on the live app
        (pre-existing latent — no FE consumer calls them); pinyinRoutes.ts declares ONLY
        `/search`, so it is not shadowed. A naive "just port the handlers" would silently
        break parity on one of the two surfaces.
Solution: a TWO-controller `CharactersModule` keeps the routers' shapes intact —
        `CharactersNestController` declares `:glyph` FIRST (reproducing the shadow: /search +
        /frequency → 400 VALIDATION_ERROR, byte-for-byte with Express), and a separate
        `PinyinNestController` hosts `GET /v1/pinyin/search` (not shadowed, real 2xx). The
        /search + /frequency handlers are still ported (declared after :glyph, shadow
        identically) and their 2xx logic is covered by CharactersService unit tests. The
        harness asserts BOTH behaviors: /search + /frequency → 400 shadow on Nest, pinyin
        /search → 200 deep-equal.
Impact: the port reproduces the live app's route table exactly (including its latent quirk) —
        byte-for-byte parity, no behavior canonized; documented as a pre-existing latent bug
        with the note that reordering charactersRoutes.ts would activate the full routes.
```

### Calibrated optional-auth on mnemonics — guest is empty, never 401, never all-unlocked

```
Problem: mnemonics GET uses optionalAuth on Express, so guests can read shared/cached stories,
        but the port must implement the CALIBRATED F6 semantics — a guest proceeds with
        req.userId UNDEFINED, and the lookup must never return another user's edited story.
        The Express code had the same intent, but the Nest port is the first place the
        calibrated contract is exercised on a real (non-hermetic) module with a DB.
Root Cause: the 4-step lookup chain (user-edited → cache → DB(AI) → generate) is the leak
        surface: step 1 filters by (characterGlyph, userId), and Prisma ignores `undefined`
        filters — the same class of bug as the P0-1 review leak (24-1). If a guest's userId
        were ever truthy, or if the guard mis-attached a stale identity, a guest could read
        another user's edited story.
Solution: (1) `OptionalAuthGuard` (24-5 calibrated) leaves `req.userId` undefined for a guest
        — never 401 on GET; (2) `getMnemonic(character, userId?)` types userId as
        `string | undefined` and the service guards step 1 with `if (userId) { … }`, so an
        undefined userId structurally skips the user-edited branch — a guest gets
        shared/cached/static data only; (3) the harness proves it end-to-end: after an authed
        PUT creates a user-edited story for writeGlyph, a guest GET on the same glyph returns
        `{ mnemonic: null }` on BOTH apps — never the other user's rows, never all-unlocked.
        Writes stay `RequireAuthGuard` (guest → 401 AUTH_REQUIRED, parity-asserted), with the
        controller's own `!userId → 401 AUTH_ERROR` branches kept as defense-in-depth mirroring
        the Express controller structure.
Impact: the calibrated guest-read semantics are proven on a real module + DB, setting the
        pattern for every later optional-auth consumer (24-10 audio, 24-12 readers, 24-13
        quiz/progression); the F6 contract is exercised (not just specified).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `charactersByGlyph`/`charactersPhonetic`/`charactersHomophones`/`charactersDecomposition`/`charactersSearch`/`charactersFrequency`/`pinyinSearch`/`mnemonicsByChar` (`/v1/characters/*`, `/v1/pinyin/search`, `/v1/mnemonics/:character`, `/api` prefix applied by the shell)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `CharactersModule`/`CharactersNestController`/`PinyinNestController`/`MnemonicsModule`/`MnemonicsNestController`/`rateLimitMnemonics`/`MNEMONICS_*_LIMITER_CONFIG` copied from the shipped `modules/characters/nest/**`, `modules/mnemonics/nest/**`, `nest/rate-limit.config.ts`, `nest/configure-app.ts`, `nest/app.module.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — **DB-backed**: `CharactersRepository`/`PinyinSearchRepository`/`MnemonicsRepository` (Prisma) + the DB-gated parity harness (`checkDatabase`, real users, pictograph fixtures from the seeded DB); mnemonics Gemini path short-circuited via pictograph fixtures (no real AI)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **DB-gated parity harness** (`tests/integration/nest/characters-mnemonics-parity.test.ts`, **24 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` skips the whole suite when `DATABASE_URL` is missing/unreachable. Assertion helpers: `expectParity2xx` (status + deep-equal body), `expectEnvelope` (`{code, message, requestId}` + requestId echoes `X-Request-Id`), `expectParity4xxData` (characters/pinyin: Nest envelope `code` = Express `code`, `message` = Express `error`), `expectParity4xxMnem` (mnemonics: `code`/`message` byte-for-byte), `expectMnemonicParity` (status + stable fields deep-equal + ISO timestamps). Coverage:
  - **characters** (6 + 3 Nest-only): `:glyph/phonetic` 200 deep-equal · `:glyph/homophones` 200 · `:glyph/homophones?exactTone=true` 200 · `:glyph/decomposition` 200 (×2) · `:glyph/phonetic` 404 (no phonetic component, reached via `phoneticComponentId: null`) · single-segment `:glyph` 200 (Nest-only characters shape — foundations collision, 24-9) · `abc` 400 `VALIDATION_ERROR` (Nest-only) · `/search` + `/frequency` 400 shadow (Nest-only).
  - **pinyin** (3): `/search?q=…` 200 deep-equal · `/search` 400 (missing q) · `?q=ma&tone=9` 400 (invalid tone).
  - **mnemonics** (12): pictograph guest GET 200 static note (stable fields) · plain guest GET `{ mnemonic: null }` deep-equal · `ab` guest 400 · guest POST 401 `AUTH_REQUIRED` (parity) · authed invalid-character POST 400 · pictograph authed POST 201 static note (no Gemini) · authed PUT 200 upsert (sequential, stable fields) · empty-story PUT 400 · authed GET sees own user-edited story 200 · **guest GET on a glyph WITH a user-edited story → `{ mnemonic: null }` (F6: never another user's rows, deep-equal)** · authed DELETE 204 · guest DELETE 401.
- **Controller unit tests** (`modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts`, **18 tests**) — service mocked (no real Gemini/GCS/Redis): `getMnemonic` (5 — authed story, **guest passes `undefined` userId (F6)**, no-story → 200 `{ mnemonic: null }`, invalid 400, unexpected 500), `generateMnemonic` (5 — authed 201, defense-in-depth `!userId` 401, invalid 400, AI-error → 503, unexpected 500), `updateMnemonic` (5 — HTML sanitization, missing/empty story 400, `MAX_STORY_LENGTH` 400, `radicalIds` 400, defense-in-depth 401), `resetMnemonic` (3 — authed 204, invalid 400, defense-in-depth 401). Covers the paths the DB-gated harness cannot reach without real Gemini (non-pictograph AI-generate 201, AI-error → 503, PUT sanitization).
- **Cleanup**: `afterAll` deletes the created user's mnemonic rows + sessions + user and disconnects the DB; fixture rows are idempotently removed.
- **Rate-limit isolation**: both apps set `trust proxy 1`; every mnemonics/register request sends a UNIQUE `X-Forwarded-For` (TEST-NET-3 `203.0.113.0/24`) so the per-method limiters (GET 60 / POST 10 / PUT 30 / DELETE 30 / auth 5) never trip mid-suite.
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` 59/649 ✅ · `test:integration` 18/166 (+24) ✅ · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke (`pinyin/search` 200 · `characters/好/phonetic` 404 envelope · mnemonics guest GET 200 static · guest POST 401 `AUTH_REQUIRED` · `characters/abc` 400 `VALIDATION_ERROR`) ✅.
