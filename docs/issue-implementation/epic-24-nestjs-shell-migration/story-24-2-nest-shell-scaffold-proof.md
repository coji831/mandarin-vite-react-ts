**Last Updated:** August 21, 2026

# Implementation 24-2: NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-2-nest-shell-scaffold-proof.md`
> **Last Updated:** August 21, 2026
> **Status:** Planned

## Technical Scope

Scaffold the NestJS 11 shell (Express platform adapter) as a parallel, dev-only entrypoint, and port four zero-dependency reference-data modules (`words`, `phonetic-clusters`, `grammar`, `chengyu`) as Nest modules reusing the existing services/repositories unchanged — verified by a route-response parity harness against the still-production Express app. Express remains the production entry (`node dist/app/index.js` via `railway.toml`/`Procfile`/`start`); the Nest shell compiles to `dist/nest/main.js` as a side artifact of the same `tsc` pass.

**Files:**

- `verification-artifacts/` — **NEW**: baseline record (full + integration pass/fail captured + **triaged before any work starts** — the epic-level T1 hard precondition).
- `apps/backend/package.json` — **UPDATE**: add deps `@nestjs/common`/`@nestjs/core`/`@nestjs/platform-express` `^11` + `reflect-metadata` `^0.2`; dev dep `@nestjs/testing` `^11`; `engines` → `>=22`; add scripts `dev:nest` (`tsx watch src/nest/main.ts`) + `start:nest` (`node dist/nest/main.js`). `predev`/`prebuild`/`start`/`build` untouched.
- `apps/backend/package-lock.json` — **UPDATE**: lock the new deps (single-version guard `npm ls express`; merge via `npm install`).
- `apps/backend/tsconfig.json` — **UPDATE**: add `experimentalDecorators` + `emitDecoratorMetadata` (inherited by all configs); `isolatedModules` stays.
- `apps/backend/.node-version` — **UPDATE**: 20 → 24.
- `apps/backend/.nvmrc` — **UPDATE**: 20.19.0 → 24.x.
- `apps/backend/src/nest/main.ts` — **NEW**: `NestFactory.create(AppModule)` boot shape (CORS allowlist, `trust proxy 1`, cookie-parser, `/api` prefix, `enableShutdownHooks`, `listen(config.port)`).
- `apps/backend/src/nest/app.module.ts` — **NEW**: `@Module({ imports: [WordsModule, PhoneticClustersModule, GrammarModule, ChengyuModule] })`.
- `apps/backend/src/modules/words/nest/words.module.ts` + `words-nest.controller.ts` — **NEW**: `@Module` + Nest controller (reuses `WordsService`/`MeasureWordService`/`WordsRepository`/`MeasureWordRepository` unchanged).
- `apps/backend/src/modules/phonetic-clusters/nest/*.ts` — **NEW**: module + controller (2 routes).
- `apps/backend/src/modules/grammar/nest/*.ts` — **NEW**: module + controller (2 routes).
- `apps/backend/src/modules/chengyu/nest/*.ts` — **NEW**: module + controller (2 routes).
- `apps/backend/tests/integration/nest/route-parity.test.ts` — **NEW**: parity harness booting both apps in-process via supertest.
- `verification-artifacts/` — **NEW**: baseline record (full + integration pass/fail captured before work).

## Implementation Details

### Shell scaffolding — deps + tsconfig

Add `@nestjs/common`/`@nestjs/core`/`@nestjs/platform-express` `^11` + `reflect-metadata` as dependencies; `@nestjs/testing` `^11` as a dev dependency. Deliberately **absent**: `@nestjs/config` (config stays in `src/shared/config/index.ts`), `@nestjs/throttler` (rate-limit parity deferred to 24-3), `@nestjs/swagger`, `nest-cli.json`.

```jsonc
// apps/backend/package.json (excerpt)
"engines": { "node": ">=22" },             // Node 24 LTS pin (tech-mapping C1)
"dependencies": {
  "@nestjs/common": "^11",
  "@nestjs/core": "^11",
  "@nestjs/platform-express": "^11",
  "reflect-metadata": "^0.2"
  // ... existing deps unchanged (express ^5.2.1, prisma ^7.8.0, etc.)
},
"devDependencies": {
  "@nestjs/testing": "^11"
  // supertest ^7.2.2 + @types/supertest ^7.2.0 already present
}
```

```jsonc
// apps/backend/tsconfig.json (excerpt) — inherited by all configs
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

> ⚠️ **esbuild/tsx gap (design decision):** `tsx` (esbuild) does **not** emit decorator metadata, so Nest's auto constructor-param injection won't resolve in the dev loop. This story therefore uses **explicit `useFactory` providers + `@Inject()` decorators** (the exact mapping in `docs/knowledge-base/backend/module-level-containers.md`) — no metadata dependency in dev; the compiled production build (if Nest ever runs it) gets metadata for free.

### Build strategy — keep plain `tsc`

`nest build` only wraps `tsc`; adopting it now changes the pipeline for zero benefit. Keep `build: "tsc -p tsconfig.build.json && node -e …cpSync(openapi.yaml)"` unchanged. The Nest shell compiles to `dist/nest/main.js` as a side artifact of the same `tsc` pass.

### Bootstrap shape — `src/nest/main.ts` (NEW)

Maps the existing `src/app/index.ts` middleware 1:1 onto Nest, **without touching the Express entry**:

```typescript
import "reflect-metadata";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { config, validateConfig } from "../shared/config/index.js";
import { AppModule } from "./app.module.js";

validateConfig(); // same fail-fast as Express

const app = await NestFactory.create(AppModule, { bufferLogs: false });

// Express-adapter parity with app/index.ts:
app.getHttpAdapter().getInstance().set("trust proxy", 1); // rate-limit real-IP (Railway)
app.setGlobalPrefix("api");                                // Express mounts routes under /api
app.use(cookieParser());                                   // httpOnly cookie auth (parity now, harmless)
app.enableCors({ origin: /* same allowlist as Express: frontendUrl + localhost:5173/5174/3000 + *.vercel.app + *.up.railway.app */,
  credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"] });
app.enableShutdownHooks();                                 // graceful shutdown (cache quit comes later)

await app.listen(config.port, "0.0.0.0");
```

Deferred (per the story scope): `requestIdMiddleware` → interceptor (24-3), `errorHandler` → filter (24-3), Swagger → 24-15. `uncaughtException`/`unhandledRejection`/SIGTERM/SIGINT handlers stay on the Express entry (untouched).

### `AppModule` — `src/nest/app.module.ts` (NEW)

```typescript
@Module({ imports: [WordsModule, PhoneticClustersModule, GrammarModule, ChengyuModule] })
export class AppModule {}
```

Deliberately imports **only** the 4 ported modules — no shared infra module, no health — so the shell is a pure proof-of-pattern.

### Reference-module port (the documented 1:1 mapping)

Per-module translation of the `container.ts` factory (`modules/<name>/container.ts`) → a Nest `@Module`, co-located and suffixed to coexist with the Express wiring:

```
modules/words/
  nest/
    words.module.ts           # @Module — NEW
    words-nest.controller.ts  # Nest controller — NEW
  container.ts                # Express factory — UNTOUCHED
  api/WordsController.ts      # Express controller — UNTOUCHED
  services/WordsService.ts    # REUSED as-is (framework-agnostic)
  repositories/WordsRepository.ts  # REUSED as-is
```

**Example — `words.module.ts`** (explicit providers, no metadata reliance, mirrors `createWordsModule` exactly):

```typescript
@Module({
  controllers: [WordsNestController],
  providers: [
    { provide: WordsRepository, useFactory: () => new WordsRepository() },
    { provide: MeasureWordRepository, useFactory: () => new MeasureWordRepository() },
    { provide: WordsService, useFactory: (r) => new WordsService(r), inject: [WordsRepository] },
    {
      provide: MeasureWordService,
      useFactory: (r) => new MeasureWordService(r),
      inject: [MeasureWordRepository],
    },
  ],
  exports: [WordsService, MeasureWordService],
})
export class WordsModule {}
```

Nest controllers **bypass** the `req.xController` pattern entirely — they are new Nest-style classes (`@Controller`, `@Get`, return value, `@Param`) that call the **same services**:

```typescript
@Controller("v1/words") // + global prefix "api" → /api/v1/words
export class WordsNestController {
  constructor(
    @Inject(WordsService) private readonly wordsService: WordsService,
    @Inject(MeasureWordService) private readonly measureWordService: MeasureWordService,
  ) {}

  @Get(":glyph") async getWordDetail(@Param("glyph") glyph: string) {
    /* replicate success JSON; throw BadRequest/NotFound */
  }
  @Get(":id/measure-words") async getMeasureWords(@Param("id") id: string) {
    /* … */
  }
}
```

Path patterns (`:glyph`, `:id/measure-words`, `:id`) are copied verbatim from the existing route files under `apps/backend/src/modules/*/api/` so the surface matches Express exactly. 4xx behavior uses `BadRequestException`/`NotFoundException`; envelope-parity on 4xx is deferred to 24-3.

**Ported route surface (all verified verbatim in `ROUTE_PATTERNS` / route files):**

| Module              | Routes (Express → Nest `@Get`)                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `words`             | `GET /v1/words/:glyph` (`wordsByGlyph`), `GET /v1/words/:id/measure-words` (`wordsMeasureWords`)           |
| `phonetic-clusters` | `GET /v1/phonetic-clusters` (`phoneticClusters`), `GET /v1/phonetic-clusters/:id` (`phoneticClustersById`) |
| `grammar`           | `GET /v1/grammar/patterns` (`grammarPatterns`), `GET /v1/grammar/patterns/:id` (`grammarPatternById`)      |
| `chengyu`           | `GET /v1/chengyu/idioms` (`chengyuIdioms`), `GET /v1/chengyu/idioms/:id` (`chengyuIdiomById`)              |

### Parity harness — `tests/integration/nest/route-parity.test.ts` (NEW)

Boots **both** apps in-process via `supertest` — the Express `src/app/index.ts` default export and the Nest `NestFactory.create(AppModule)` `getHttpServer()` — then for every ported route:

1. **2xx paths:** identical `status` **and** identical `body` (deep-equal) — reference data is deterministic; `X-Request-Id`/`requestId` is ignored (varies per request).
2. **4xx paths:** identical `status` only; body-envelope parity (`{code, message, requestId}`) deferred to 24-3.

Placed under `tests/integration/nest/` so it runs under `vitest.integration.config.ts` (real DB, `fileParallelism: false`, 30s timeout) and is **excluded from the default `test:full`** — consistent with how the repo gates DB tests, and it won't break Tier-1 `npm test` (changed-scope excludes it unless touched). Include a "skip with message" guard when `DATABASE_URL` is absent so a bare `test:integration` on an unseeded machine reports clearly rather than failing. The covered route set includes **`WordsRoutes.ts`** (uppercase filename — `apps/backend/src/modules/words/api/WordsRoutes.ts`) alongside `PhoneticClustersRoutes`, `GrammarRoutes`, `ChengyuRoutes`, so the harness exercises the actual route-file casing used in production.

## Architecture Integration

```
[Story 24-2: NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern]
├── src/nest/main.ts + app.module.ts (NestFactory, Express adapter) — NEW dev-only entry
├── modules/{words,phonetic-clusters,grammar,chengyu}/nest/ — Nest @Module + controllers (NEW)
│     └── reuse services/repositories UNCHANGED (framework-agnostic)
├── Express production path — UNTOUCHED: app/index.ts → dist/app/index.js → railway.toml/Procfile/start
├── tests/integration/nest/route-parity.test.ts — parity harness (both apps, supertest)
└── parallel-safety: zero 25–28 collision-zone files touched
```

Dependencies: none (branches from main; the only shared-track files are `apps/backend/package.json`/`package-lock.json` + `apps/backend/tsconfig.json` — single-PR discipline). Parallel-safety: touches **no** 25–28 collision zone (review/quiz/audio/progression/radicals/foundations/`authMiddleware`/`shared-constants`/Prisma schema); guard = don't delete/rename any file 25–28 references; parity copies patterns from route files, not `ROUTE_PATTERNS` builders.

## Technical Challenges & Solutions

### esbuild/tsx does not emit decorator metadata

```
Problem: `tsx watch` (esbuild) emits no `emitDecoratorMetadata`, so NestJS auto
        constructor-param injection cannot resolve in the dev loop.
Solution: Use explicit `useFactory` providers + `@Inject()` decorators (the exact
        mapping in `docs/knowledge-base/backend/module-level-containers.md`); still
        set `experimentalDecorators`/`emitDecoratorMetadata` so the compiled tsc
        build gets metadata for free. No metadata dependency in dev.
```

### Dual-mode coexistence (Express prod + Nest dev-only shell)

```
Problem: Two controller surfaces per ported module (Express `api/*Controller.ts`
        serving production + Nest `nest/*-controller.ts` inside the shell).
Solution: Temporary by design — services/repos are shared, only the thin controller
        duplicates; Express controllers are deleted at each module's cutover (24-15).
        This is what makes the parity harness meaningful (both surfaces coexist) and
        the swap zero-risk (Express keeps serving production).
```

### Express 5 ↔ NestJS 11 adapter compatibility

```
Problem: The backend is on Express 5.2.1; NestJS 11's Express adapter must preserve
        Express 5 semantics (async error propagation, route wildcards) — unverified
        before scaffolding.
Solution: Verify at scaffold via `npm ls express` (single 5.x version) and treat the
        parity harness as the compat smoke test. If the adapter forces an Express 4
        peer, record it as a decision — do not silently change the production path.
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

| Test                                                                                                              | Status in 24-2                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| All existing module/shared unit tests (`src/modules/**/__tests__/`, `src/shared/**/__tests__/`, `tests/modules/`) | Keep passing untouched — repos/services unchanged; `createXModule(mockDeps)` factories intact                    |
| **NEW parity harness** `tests/integration/nest/route-parity.test.ts`                                              | The proof — 2xx identical status + body (deep-equal), 4xx identical status, skip-guard on missing `DATABASE_URL` |
| Stale `ReadersAudioController.test.ts`                                                                            | Out of scope (readers untouched) — flagged for 24-11/24-12                                                       |

**Sequence (for the executing Engineer):** (1) **baseline (T1 hard precondition)** — `npm run test:full` + `npm run test:integration`, real pass/fail recorded + failures triaged in a verification artifact **before any work starts**; (2) scaffold — Nest deps + tsconfig flags + Node reconciliation + `src/nest/main.ts`/`app.module.ts` + `dev:nest`/`start:nest`; gate `npm run build` (Express entry untouched + `dist/nest/main.js` emitted) + `typecheck`; (3) port `phonetic-clusters` first (simplest — validates the whole pattern); (4) port `words` (incl. `WordsRoutes.ts` casing), `grammar`, `chengyu`; (5) parity harness — `npm run test:integration`; (6) gates + docs close.

**Quality gates (canonical two-tier):** Tier 1 — `npm run build`, `npm run lint` (0 errors), `npm test` (changed scope); Tier 2 — `npm run test:full`, `npm run typecheck --workspace=@mandarin/backend`, `npm run check:module-boundaries` (no new `shared/`→`modules/` edge), `npm run test:integration` (parity harness green). Smoke test — `npm run dev:nest` + curl the 4 modules' routes returns the exact success JSON per route.
