**Last Updated:** August 21, 2026

# Implementation 24-9: Radicals + Foundations Port

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-9-radicals-foundations-port.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `edc1ec49`

## Implementation Summary

Ported the `radicals` module (4 routes) and the `foundations` module (4 routes) from Express to the NestJS 11 shell under `apps/backend/src/modules/<name>/nest/` — the **zero-dependency pair**, the cheapest ports in the epic — and **resolved the cross-module `/:glyph` route-shadowing deferred from 24-8** (foundations' `GET /v1/characters/:glyph` owns the single-segment character path, matching the Express mount order).

**Radicals — a 1:1 of `createRadicalsModule()` (`radicals.module.ts` + `radicals-nest.controller.ts`).** `RadicalsModule` registers `RadicalsNestController` (`@Controller("v1/radicals")`, 4 routes in `radicalsRoutes.ts` order: `GET /`, `GET /:radicalId`, `GET /character/:glyph`, `GET /:radicalId/characters`) with 3 explicit `useFactory` providers: `RadicalsRepository` and `RadicalCharacterService` (both self-import the shared Prisma singleton — public static reference data, so no `SharedModule`, matching the `words` port in 24-2 and the `characters` port in 24-8) and `RadicalsService` (constructor-injected with `RadicalsRepository`). The controller mirrors `RadicalsController.ts` 1:1 with the same 2xx JSON and the same 4xx `code`/`message` (radicals Express bodies carry `{error, code}`; the 24-3 `AppExceptionFilter` serializes the thrown `HttpException`s into the `{code, message, requestId}` envelope with `code`/`message` byte-for-byte equal to the Express legacy body).

**Foundations — a 1:1 of `createFoundationsModule()` on a single `@Controller("v1")` (`foundations.module.ts` + `foundations-nest.controller.ts`).** `FoundationsModule` registers `FoundationsNestController` with one `useFactory` provider (`FoundationsService`, constructor takes nothing, self-imports Prisma). The controller's single `@Controller("v1")` base covers **both** route prefixes `foundationsRoutes.ts` spans — `GET /v1/foundations/data/pinyin-tones`, `GET /v1/foundations/data/pinyin-character-map`, `GET /v1/foundations/data/strokes` **and** the cross-module shadow `GET /v1/characters/:glyph` — 1:1 with `FoundationsController.ts` (same delegation, same 2xx JSON, same 4xx `message`; foundations Express bodies are a **plain `{error}`** — no `code` — so the Nest envelope supplies a `code` per the backend error-message convention while `message` is byte-for-byte equal to the Express `error`).

**Truth-check correction to record (stale story-brief premise):** the 24-9 brief described foundations as reading "via shared utils (contentUtils) — no DB", but the **on-disk `FoundationsService` is all-in-DB** — it reads entirely from Prisma reference tables (`pinyinPhoneme`/`tone`/`tonePair`/`toneRule`/`pinyinSyllable`/`pinyinCharacterMapping`/`strokeCategory`/`strokeOrderRule`/`character`/`characterRadical`), unchanged since epic-21's all-in-DB data lifecycle, with **no** `contentUtils` file reads at runtime (the `foundationsRoutes.ts` comments still claim GCS/file — those are stale). Because the story's binding directive is to **reuse `FoundationsService` unchanged**, no `CONTENT_UTILS` provider was injected and `SharedModule` was NOT imported — the "reuse unchanged" binding wins over the stale premise. The doc files/claims here reflect the code, not the brief.

**Route-shadowing resolution (the deferred 24-8 item).** On the live Express app, `src/app/routes.ts` mounts `foundationsRoutes` at **L60** before `charactersRoutes` at **L126** — so foundations' `characters/:glyph` captures EVERY single-segment `GET /v1/characters/<x>`, shadowing the characters module's own `:glyph` (and its `/search` + `/frequency`). The shell reproduces this by importing **`FoundationsModule` BEFORE `CharactersModule`** in `app.module.ts` — Nest registers routes in module-import order onto the same Express router, and (with no route-conflict detector fired in the main path) **first-match-wins**. Boot logs confirm the mapping order. Result, byte-for-byte with Express: `GET /v1/characters/好` → the **foundations** `CharacterDetailResponse` shape; `GET /v1/characters/search` + `/frequency` + `abc` → **404** `Character "<x>" not found`. `/search` + `/frequency` remain shadowed on BOTH apps (pre-existing latent — parity preserved, no new bug; the characters `:glyph` handler stays registered later and is reactivated only if foundations is ever removed/reordered). The foundations `getCharacterByGlyph` 400 branch (`!glyphParam || Array.isArray(...)`) is ported for controller fidelity but is **unreachable over HTTP** — Express's `:glyph` is a required single-segment param, always a string.

**The `200`-literal-`null` edge (`radicals-nest.controller.ts`).** Express's `getRadicalById` calls `res.json(radical)`, and `RadicalsService.getRadicalById` returns `null` for an UNKNOWN ID — a **200 with a literal `null` body**. Nest's default reply path strips `null`/`undefined` (`ExpressAdapter.reply`: `isNil(body)` → `response.send()`, empty body), so `getRadicalById` takes **full `@Res()` control** and calls `res.json()` directly — a byte-for-byte mirror of the Express controller that preserves the `200 null` wire body on both apps. The thrown 404 (e.g. `GET /:radicalId/characters` unknown → `RadicalNotFoundError`) still flows through the global `AppExceptionFilter` (it writes via `ctx.getResponse()`, independent of `@Res`).

**Parity harness (`tests/integration/nest/radicals-foundations-parity.test.ts`, 14 tests)** — a dedicated DB-gated suite following the established route-parity pattern: boots the real Express app (`src/app/index.ts`) + the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`), `describe.skipIf(!db.available)` on a missing DB, deterministic full-table reads (seeded `Radical`/`CharacterRadical`/`Character` fixtures) → 2xx deep-equal, 4xx envelope parity. Coverage: **radicals (7)** — list 200 · detail existing 200 · **detail unknown → `200 null` on BOTH apps** · `/character/:glyph` has-radicals 200 · `/character/:glyph` no-radicals 200 `[]` · `/:radicalId/characters` existing 200 · `/:radicalId/characters` unknown 404 envelope parity; **foundations data (3)** — pinyin-tones 200 · pinyin-character-map 200 · strokes 200; **shadow (4)** — `/characters/:glyph` existing → 200 foundations shape deep-equal · `abc` → 404 foundations parity · `/search?q=好` → 404 foundations shadow · `/frequency` → 404 foundations shadow.

**Carried-in edit to the 24-8 harness (transparency note):** the same commit also edits `tests/integration/nest/characters-mnemonics-parity.test.ts` — the 3 characters single-segment **Nest-only smokes** (written in 24-8 as "foundations collision, 24-9") are converted to **full-parity foundations-shadow assertions** (200 foundations shape / 404 `abc` / 404 search+frequency), since 24-9 restores the shadow; plus **3 pre-existing prettier reformat hunks** (the `noPhonetic` fixture line, the `getBoth` helper, `expectMnemonicParity`) that were swept in with the same-file edit. No new test was added there; the deeper shadow coverage lives in the dedicated 24-9 harness.

**Verification results (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 59 files / 649 tests · `test:integration` ✅ 19 files / 180 tests (**+1 file / +14**: the radicals-foundations parity suite) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (`GET /api/v1/radicals` 200 · `GET /api/v1/radicals/rad_0001` 200 · `GET /api/v1/foundations/data/pinyin-tones` 200 · `GET /api/v1/characters/好` → foundations shape · `GET /api/v1/characters/abc` 404 envelope).

## Technical Scope

Port the `radicals` module (4 routes) and the `foundations` module (4 routes) to the NestJS 11 shell with contract-identical behavior: a `RadicalsModule` that is a 1:1 of `createRadicalsModule()` (3 `useFactory` providers, repos self-import Prisma, 4 routes verbatim incl. the `200 null` `@Res()` mirror) and a `FoundationsModule` that is a 1:1 of `createFoundationsModule()` (single `@Controller("v1")`, 4 routes incl. the cross-module shadow `GET /v1/characters/:glyph`), with the route-shadowing reproduced via module-import order (`FoundationsModule` before `CharactersModule` in `app.module.ts`), plus a dedicated DB-gated parity harness (14 tests) and the 24-8 harness shadow-block edit. The Express radicals/foundations wiring is untouched.

**Files:**

- `apps/backend/src/modules/radicals/nest/radicals.module.ts` — **NEW**: `RadicalsModule` — 1:1 of `createRadicalsModule()`; 3 `useFactory` providers (`RadicalsRepository`, `RadicalsService` injecting `RadicalsRepository`, `RadicalCharacterService`); repos self-import Prisma (no `SharedModule`); `exports: [RadicalsService, RadicalCharacterService]`.
- `apps/backend/src/modules/radicals/nest/radicals-nest.controller.ts` — **NEW**: `RadicalsNestController` (`@Controller("v1/radicals")`) — 4 routes in `radicalsRoutes.ts` order (`/`, `/:radicalId`, `/character/:glyph`, `/:radicalId/characters`); `GET /:radicalId` uses a **full `@Res()` `res.json()`** mirror preserving the `200 null` unknown-ID body; 2xx/4xx `code`/`message` 1:1 with `RadicalsController.ts`.
- `apps/backend/src/modules/foundations/nest/foundations.module.ts` — **NEW**: `FoundationsModule` — 1:1 of `createFoundationsModule()`; `FoundationsService` via `useFactory` (constructor takes nothing, self-imports Prisma — all-in-DB, no `CONTENT_UTILS`); `exports: [FoundationsService]`.
- `apps/backend/src/modules/foundations/nest/foundations-nest.controller.ts` — **NEW**: `FoundationsNestController` (single `@Controller("v1")`) — 4 routes: `foundations/data/pinyin-tones`, `foundations/data/pinyin-character-map`, `foundations/data/strokes` + the cross-module shadow `characters/:glyph`; 1:1 with `FoundationsController.ts` (foundations Express bodies are plain `{error}` → Nest envelope supplies `code` per convention, `message` === Express `error`).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import `FoundationsModule` + `RadicalsModule` — **`FoundationsModule` BEFORE `CharactersModule`** (reproduces the Express `src/app/routes.ts` L60/L126 mount order so foundations' `characters/:glyph` captures the single-segment character path).
- `apps/backend/tests/integration/nest/radicals-foundations-parity.test.ts` — **NEW**: DB-gated parity harness — real Express app vs real Nest `AppModule` (14 tests: radicals 7 incl. the `200 null` edge, foundations data 3, shadow 4).
- `apps/backend/tests/integration/nest/characters-mnemonics-parity.test.ts` — **UPDATE**: the 3 characters single-segment Nest-only smokes → full-parity foundations-shadow assertions (200 foundations shape / 404 `abc` / 404 search+frequency) + 3 pre-existing prettier reformat hunks (carried in same-file, transparency note).

## Implementation Details

### Radicals — 1:1 of `createRadicalsModule()`

```typescript
// apps/backend/src/modules/radicals/nest/radicals.module.ts
@Module({
  controllers: [RadicalsNestController],
  providers: [
    { provide: RadicalsRepository, useFactory: () => new RadicalsRepository() },
    {
      provide: RadicalsService,
      useFactory: (repository: RadicalsRepository) => new RadicalsService(repository),
      inject: [RadicalsRepository],
    },
    { provide: RadicalCharacterService, useFactory: () => new RadicalCharacterService() },
  ],
  exports: [RadicalsService, RadicalCharacterService],
})
export class RadicalsModule {}
```

Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop; the compiled tsc build gets metadata for free. The repos self-import the shared Prisma singleton (same as the Express path), so no `SharedModule` is imported — radicals are public static reference data. Route order mirrors `radicalsRoutes.ts` exactly (`/`, `/:radicalId`, `/character/:glyph`, `/:radicalId/characters`) so the shell's router registration order matches Express (e.g. `GET /v1/radicals/character` → captured by `/:radicalId` → 404 on both apps — pre-existing latent, reproduced).

### The `200 null` wire-body mirror

```typescript
// apps/backend/src/modules/radicals/nest/radicals-nest.controller.ts
@Get(":radicalId")
async getRadicalById(@Param("radicalId") radicalId: string, @Res() res: Response): Promise<void> {
  try {
    const radical = await this.radicalsService.getRadicalById(String(radicalId));
    // Full @Res() mirror of the Express `res.json(radical)` — preserves the
    // `200 null` wire body for unknown IDs (Nest's default reply would strip it).
    res.json(radical);
  } catch (err) {
    throw new NotFoundException({ code: "NOT_FOUND", message: "Failed to load radicals" });
  }
}
```

`RadicalsService.getRadicalById` returns `null` for an unknown ID; Express's `res.json(null)` sends a **200 with a literal `null` body**. Nest's default reply (`ExpressAdapter.reply`: `isNil(body)` → `response.send()`) strips `null`/`undefined` to an empty body, so this handler takes full `@Res()` control and calls `res.json()` directly — byte-for-byte identical to Express. The thrown 404s still flow through the global `AppExceptionFilter` (it writes via `ctx.getResponse()`, independent of `@Res`).

### Foundations — 1:1 of `createFoundationsModule()` on a single `@Controller("v1")`

```typescript
// apps/backend/src/modules/foundations/nest/foundations.module.ts
@Module({
  controllers: [FoundationsNestController],
  providers: [{ provide: FoundationsService, useFactory: () => new FoundationsService() }],
  exports: [FoundationsService],
})
export class FoundationsModule {}
```

`FoundationsService` (constructor takes nothing, self-imports Prisma) is reused **unchanged** — it is **all-in-DB** (Prisma since epic-21: `pinyinPhoneme`/`tone`/`tonePair`/`toneRule`/`pinyinSyllable`/`pinyinCharacterMapping`/`strokeCategory`/`strokeOrderRule`/`character`/`characterRadical`; **no** `contentUtils`/file reads). The single `@Controller("v1")` base serves all four routes — both prefixes `foundationsRoutes.ts` spans, including the cross-module shadow:

```typescript
@Controller("v1")
export class FoundationsNestController {
  @Get("foundations/data/pinyin-tones")         // GET /v1/foundations/data/pinyin-tones
  @Get("foundations/data/pinyin-character-map") // GET /v1/foundations/data/pinyin-character-map
  @Get("foundations/data/strokes")              // GET /v1/foundations/data/strokes
  @Get("characters/:glyph")                     // GET /v1/characters/:glyph — the cross-module SHADOW route
  async getCharacterByGlyph(@Param("glyph") glyphParam: string) { /* … */ }
}
```

### Route-shadowing resolution — module-import order reproduces the Express mount order

```typescript
// apps/backend/src/nest/app.module.ts — the load-bearing ordering
imports: [
  WordsModule, PhoneticClustersModule, GrammarModule, ChengyuModule, AuthModule,
  FoundationsModule,   // ← BEFORE CharactersModule — reproduces app/routes.ts L60 (foundations)
  RadicalsModule,
  CharactersModule,    // ← registered AFTER — its :glyph stays shadowed, like Express L126
  MnemonicsModule,
  SharedModule, GuardsModule,
],
```

On the live Express app, `src/app/routes.ts` mounts `foundationsRoutes` at **L60** before `charactersRoutes` at **L126**, so foundations' `characters/:glyph` captures every single-segment `GET /v1/characters/<x>`. Nest registers routes in **module-import order** onto the same underlying Express router; no route-conflict detector fires in the main path, so **first-match-wins** applies exactly as in Express. `FoundationsModule` is imported before `CharactersModule`, so the shadow reproduces byte-for-byte: `/characters/好` → foundations `CharacterDetailResponse`; `/search` + `/frequency` + `abc` → **404** `Character "<x>" not found` on both apps. The characters `:glyph` handler remains registered (later) and is reactivated only if foundations is ever removed/reordered. The foundations `getCharacterByGlyph` 400 branch (`!glyphParam || Array.isArray(...)`) is ported for controller fidelity but is unreachable over HTTP (`:glyph` is a required single-segment param, always a string).

## Architecture Integration

```
[Story 24-9: Radicals + Foundations Port]
├── modules/radicals/nest/radicals.module.ts — 1:1 of createRadicalsModule(); 3 useFactory
│     providers (RadicalsRepository, RadicalsService, RadicalCharacterService); repos
│     self-import Prisma (no SharedModule)
├── modules/radicals/nest/radicals-nest.controller.ts — 4 routes (/ , /:radicalId,
│     /character/:glyph, /:radicalId/characters) in radicalsRoutes.ts order; GET /:radicalId
│     = full-@Res() res.json() mirror (200 null)
├── modules/foundations/nest/foundations.module.ts — 1:1 of createFoundationsModule();
│     FoundationsService via useFactory (all-in-DB, self-imports Prisma; no CONTENT_UTILS)
├── modules/foundations/nest/foundations-nest.controller.ts — single @Controller("v1");
│     4 routes incl. cross-module shadow GET /v1/characters/:glyph
├── nest/app.module.ts — imports FoundationsModule BEFORE CharactersModule (reproduces
│     app/routes.ts L60/L126 mount order → route-shadowing parity)
├── tests/integration/nest/radicals-foundations-parity.test.ts — DB-gated parity harness
│     (14 tests: radicals 7 incl. 200-null, foundations data 3, shadow 4)
├── tests/integration/nest/characters-mnemonics-parity.test.ts — UPDATE: 24-8 shadow-block
│     smokes → full-parity foundations-shadow assertions + 3 prettier reformat hunks
├── Express modules/radicals|foundations (container.ts + api/*) — UNTOUCHED
│     (production surface until 24-15 cutover)
└── Dependencies: 24-3 (envelope) · 24-8 (characters ported first; cross-module shadow
      deferred to 24-9)
```

Dependencies: **24-3** (the `{code, message, requestId}` envelope the 4xx paths inherit), **24-8** (characters ported first; the cross-module `/:glyph` shadow was deferred from 24-8 and this story resolves it). Parallel-safety: **additive** — the Express radicals/foundations wiring is untouched; **no** `packages/shared-constants` / `packages/shared-types` / FE change; **no** 25–28 collision-zone file touched. Consumer: none ported yet — both modules are leaf reference-data modules (radicals/foundations are read-only data surfaces; nothing else imports their Nest modules).

## Technical Challenges & Solutions

### Reproducing the cross-module route-shadowing — module-import order + first-match-wins

```
Problem: on the live Express app, GET /v1/characters/<x> (single segment) is served by the
        FOUNDATIONS module — its `characters/:glyph` route captures every single-segment
        character path, shadowing the characters module's own `:glyph` (and its
        `/search` + `/frequency`). 24-8 ported characters first and could only document
        this as a deferred parity item — the shell (characters-only) served the characters
        shape on `/characters/好`, which did NOT match Express. Porting foundations naively
        (e.g. after characters, or via a separate router) would silently keep the shell's
        route table different from Express on every single-segment character path.
Root Cause: route matching in both Express and Nest is path-to-regexp **first-match-wins in
        registration order**; in Express the registration order comes from `app/routes.ts`
        (foundations mounted at L60 BEFORE characters at L126). Nest registers module routes
        onto the same underlying Express router in **module-import order** — so a cross-module
        shadow depends entirely on the `imports` array order in `app.module.ts`.
Solution: import `FoundationsModule` BEFORE `CharactersModule` in `app.module.ts` — Nest
        registers foundations' `characters/:glyph` first, so it captures every single-segment
        `GET /v1/characters/<x>` exactly as Express does (first-match-wins; the route-conflict
        detector is not invoked in the main path, so the two `:glyph` handlers simply coexist
        in registration order). Boot logs confirm the mapping order. The harness proves it
        end-to-end: `/characters/好` → 200 foundations `CharacterDetailResponse` deep-equal on
        both apps; `/search` + `/frequency` + `abc` → 404 `Character "<x>" not found` on both.
        The 24-8 harness's Nest-only smokes were converted to full-parity assertions in the
        same commit (transparency note).
Impact: the shell's route table now matches Express on every single-segment character path
        (foundations shape + 404s), the deferred 24-8 parity item is closed, and the pattern
        is established for any later cross-module shadow (module-import order = route order).
```

### The `200`-literal-`null` wire body — full `@Res()` mirror

```
Problem: `GET /v1/radicals/:radicalId` for an UNKNOWN ID returns **200 with a literal `null`
        JSON body** on Express (`RadicalsController.getRadicalById` → `res.json(radical)` where
        `RadicalsService.getRadicalById` returns `null`). A straightforward Nest handler
        returning `null` would NOT reproduce it — Nest's default reply path strips
        `null`/`undefined` (`ExpressAdapter.reply`: `isNil(body)` → `response.send()`), sending
        an empty body instead of the literal `null`.
Root Cause: `isNil(null)` is true, so Nest's default reply treats `null` as "no body" — a
        framework default that differs from Express's explicit `res.json(null)` (which sends
        the literal `null` wire body). The parity harness asserts `res.nestRes.body` is
        literally `null` (`expect(...).toBeNull()`), so the mismatch would fail parity.
Solution: `getRadicalById` takes full `@Res()` control and calls `res.json(radical)` directly —
        a byte-for-byte mirror of the Express controller that preserves the `200 null` wire
        body on BOTH apps. The thrown 404s (e.g. `GET /:radicalId/characters` unknown →
        `RadicalNotFoundError`) still flow through the global `AppExceptionFilter` (it writes
        via `ctx.getResponse()`, independent of `@Res`), so the 4xx envelope parity is intact.
Impact: the `200 null` edge is byte-for-byte identical across apps; the harness pins it
        explicitly (unknown-ID test asserts both bodies are `null`).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `radicals`/`radicalsById`/`radicalsByCharacter`/`radicalsCharacters`/`foundationsPinyinTones`/`foundationsPinyinCharacterMap`/`foundationsStrokes`/`charactersByGlyph` (`/v1/radicals/*`, `/v1/foundations/data/*`, `/v1/characters/:glyph`, `/api` prefix applied by the shell)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `RadicalsModule`/`RadicalsNestController`/`RadicalsRepository`/`RadicalsService`/`RadicalCharacterService`/`FoundationsModule`/`FoundationsNestController`/`FoundationsService` copied from the shipped `modules/radicals/nest/**`, `modules/foundations/nest/**`, `nest/app.module.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — **all-in-DB**: `FoundationsService` reads Prisma reference tables only (`pinyinPhoneme`/`tone`/`tonePair`/`toneRule`/`pinyinSyllable`/`pinyinCharacterMapping`/`strokeCategory`/`strokeOrderRule`/`character`/`characterRadical`; no `contentUtils`/file reads); `RadicalsRepository`/`RadicalCharacterService` self-import the Prisma client; DB-gated parity harness (`checkDatabase`, seeded fixtures)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **DB-gated parity harness** (`tests/integration/nest/radicals-foundations-parity.test.ts`, **14 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` skips the whole suite when `DATABASE_URL` is missing/unreachable. Assertion helpers: `expectParity2xx` (status + deep-equal body), `expectEnvelope` (`{code, message, requestId}` + requestId echoes `X-Request-Id`), `expectParity4xxData` (radicals: Nest envelope `code` = Express `code`, `message` = Express `error`), `expectParity4xxNoCode` (foundations: Express has no `code`, Nest `message` = Express `error`). Coverage:
  - **radicals** (7): list 200 deep-equal · detail existing 200 · **detail unknown → `200 null` on BOTH apps (`expect(body).toBeNull()`)** · `/character/:glyph` has-radicals 200 · `/character/:glyph` no-radicals 200 `[]` · `/:radicalId/characters` existing 200 (radicalId + characters array) · `/:radicalId/characters` unknown 404 (`NOT_FOUND`, envelope `message` = "Failed to load radical characters").
  - **foundations data** (3): pinyin-tones 200 deep-equal (initials + combinations arrays) · pinyin-character-map 200 deep-equal (object) · strokes 200 deep-equal (strokes + strokeOrderRules arrays).
  - **shadow** (4): `/characters/:glyph` existing → 200 **foundations** shape deep-equal (glyph + readings) · `abc` → 404 foundations parity (`Character "abc" not found`) · `/search?q=好` → 404 foundations shadow · `/frequency` → 404 foundations shadow.
- **24-8 harness update** (`characters-mnemonics-parity.test.ts`) — the 3 characters single-segment Nest-only smokes converted to full-parity foundations-shadow assertions (now that 24-9 restores the shadow): `:glyph` existing → 200 foundations shape (full parity), `abc` → 404 foundations parity, `/search` + `/frequency` → 404 foundations shadow; plus 3 pre-existing prettier reformat hunks carried in the same-file edit (transparency note — no new tests added here; the deeper shadow coverage lives in the dedicated 24-9 harness).
- **Cleanup**: `afterAll` closes the Nest app and disconnects the DB (the harness is read-only — deterministic seeded reads, no fixtures created).
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` 59/649 ✅ · `test:integration` 19/180 (+1 file / +14) ✅ · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke (`radicals` 200 · `radicals/rad_0001` 200 · `foundations/data/pinyin-tones` 200 · `characters/好` → foundations shape · `characters/abc` 404 envelope) ✅.
