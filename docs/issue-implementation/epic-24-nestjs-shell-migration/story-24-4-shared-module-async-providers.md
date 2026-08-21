**Last Updated:** August 21, 2026

# Implementation 24-4: SharedModule/DatabaseModule + Async Providers

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-4-shared-module-async-providers.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** _(to be filled at epic close)_

## Implementation Summary

Shipped the DI substrate of the Nest shell: `SharedModule`/`DatabaseModule` (in `apps/backend/src/nest/shared/`) expose the shared infrastructure as Nest providers, wired into `AppModule` (story 24-4). `CacheService` is resolved via an async `useFactory` (`await CacheFactory.create("default")`) — converting the Express container's top-level await into a provider that resolves before bootstrap completes and before the first request. `PrismaClient` is a singleton `useFactory` provider replicating the Prisma 7 CJS-only default-import + `PrismaPg` connection-string pattern from `src/shared/infrastructure/database/client.ts`. External clients (`GeminiClient`/`GCSClient`/`GoogleTTSClient`/`GeminiService`) and `GcsFileStore` are lazy-singleton providers — no top-level `new GCSClient()` in Nest land. Both modules implement graceful shutdown. The Express `app/container.ts` is untouched; Nest has its own provider path.

**Three documented deviations from the IMP pseudocode:**

1. **String-const `InjectionToken`s, not inline string literals** — the pseudocode used `{ provide: "CONFIG", … }` literals; shipped `shared.module.ts` exports typed string-const tokens (`CONFIG`, `GATE_THRESHOLDS_TOKEN`, `AUDIO_CONFIG_TOKEN`, `CONTENT_UTILS`) so consumers import the token rather than duplicating the literal.
2. **`PrismaClient` re-exported transitively via `DatabaseModule`, not directly from `SharedModule`** — `SharedModule` imports + re-exports `DatabaseModule` (which provides/exports `PrismaClient`); consumers importing `SharedModule` can `@Inject(PrismaClient)` without re-importing the CJS package directly.
3. **`contentUtils` exposed via the `CONTENT_UTILS` token** — `contentUtils` is a module namespace (`import * as contentUtils`), not a `ContentUtils` class, so it is provided as `useValue: contentUtils` under the token rather than `useFactory: () => new ContentUtils()`.

**Other key shipping decisions:**

- **Graceful shutdown:** `DatabaseModule.onApplicationShutdown` → `await this.prisma.$disconnect()`; `SharedModule.onApplicationShutdown` → `await redisClient.quit()` — the shared Redis client is the connection owner behind `CacheService`, which exposes no teardown of its own (verified: no `quit`/`disconnect`/teardown surface in `CacheService.ts`).
- **Three config homes as providers:** `CONFIG` (readonly `config` from `src/shared/config`), `GATE_THRESHOLDS_TOKEN` (`src/config/gate-thresholds.ts`), `AUDIO_CONFIG_TOKEN` (`src/modules/audio/config.ts`).
- **`GcsFileStore` DI fix:** `GcsFileStore.ts` constructor now accepts `{ bucket?, gcsClient? }` with a lazy fallback (`gcsClient ?? new GCSClient()`) — backward-compatible with existing `new GcsFileStore({ bucket })` call sites while letting Nest inject the shared `GCSClient` provider; the module-scope client construction is gone. (`GcsFileStore.ts` is a `shared/infrastructure` file, which is allowed to be edited — `shared/` is not a 25–28 zone.)
- **`vitest.config.ts`:** `src/nest/**/__tests__/**/*.test.ts` added to the test include patterns so the provider tests run in the default suite.

**Verification (against the shipped commit — hash deferred to epic close):** typecheck + `build` green (both dist entries emitted incl. `dist/nest/shared`); `lint` 0 errors; `test:full` 57/611; `test:integration` 15/112; `check:module-boundaries` green (no new `shared/`→`modules/` edge); `dev:nest` boots and the async `CacheService` resolves before routes are served.

## Technical Scope

Expose the shared infrastructure as Nest providers so cache/gemini/jwt-dependent modules can be ported: `DatabaseModule` → `PrismaClient` (handling the Prisma 7 CJS-only default-import + `PrismaPg` connection-string adapter inside the factory); `SharedModule` → `config` (readonly from `src/shared/config`), `CacheService` via async `useFactory` (`await CacheFactory.create("default")` — resolves the top-level-await), `contentUtils`, shared `WordRepository` (`IWordRepository`), `JwtService`, `PasswordService`, and external clients (`GeminiClient`, `GCSClient`, `GcsFileStore`, `GoogleTTSClient`, `GeminiService`) as lazy-singleton providers. Both modules implement **graceful shutdown** (`onApplicationShutdown`: `PrismaClient.$disconnect()`, `redisClient.quit()`, cache teardown). The Express `app/container.ts` is untouched; Nest gets its own provider path.

**Files:**

- `apps/backend/src/nest/shared/database.module.ts` — **NEW**: `DatabaseModule` exposing the `PrismaClient` provider (Prisma 7 CJS-only default-import + `PrismaPg` connection-string adapter) + `OnApplicationShutdown` → `prisma.$disconnect()`.
- `apps/backend/src/nest/shared/shared.module.ts` — **NEW**: `SharedModule` exposing the three config homes (`CONFIG`/`GATE_THRESHOLDS_TOKEN`/`AUDIO_CONFIG_TOKEN`), `CacheService` (async `useFactory`), `CONTENT_UTILS`, shared `WordRepository`, `JwtService`, `PasswordService`, and external clients (`GeminiClient`/`GCSClient`/`GoogleTTSClient`/`GeminiService`/`GcsFileStore`) as lazy-singleton providers + `OnApplicationShutdown` → `redisClient.quit()`.
- `apps/backend/src/nest/shared/__tests__/shared-module.providers.test.ts` — **NEW**: unit tests — `CacheService` async resolution before bootstrap; `PrismaClient` singleton; the three config homes + `CONTENT_UTILS` exposed; external clients lazy + `GcsFileStore` delegates to the injected `GCSClient`; graceful-shutdown hooks (`$disconnect()` / `redisClient.quit()`).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: wire `SharedModule` (which imports `DatabaseModule`) so the shared substrate is available to later module ports.
- `apps/backend/src/shared/infrastructure/storage/GcsFileStore.ts` — **UPDATE**: DI fix — constructor accepts an injected `GCSClient` (`{ bucket?, gcsClient? }`) with lazy fallback (`gcsClient ?? new GCSClient()`); removes module-scope client construction; backward-compatible (`shared/` is not a 25–28 zone).
- `apps/backend/vitest.config.ts` — **UPDATE**: add `src/nest/**/__tests__/**/*.test.ts` to the test include patterns.

## Implementation Details

### `DatabaseModule` → `PrismaClient` provider (NEW)

Handles the Prisma 7 known-gotcha pattern inside the factory (mirrors `src/shared/infrastructure/database/client.ts`):

```typescript
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../../shared/config/index.js";

const { PrismaClient } = prismaPkg; // Prisma 7: CJS-only default import

@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () =>
        new PrismaClient({
          adapter: new PrismaPg({ connectionString: config.databaseUrl }), // adapter gets a connection string, not a pg.Pool
        }),
    },
  ],
  exports: [PrismaClient],
})
export class DatabaseModule {}
```

### `SharedModule` → shared providers (NEW)

```typescript
@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: "CONFIG", useFactory: () => config }, // readonly from shared/config
    { provide: CacheService, useFactory: async () => await CacheFactory.create("default") }, // resolves the top-level-await
    { provide: ContentUtils, useFactory: () => new ContentUtils() },
    { provide: WordRepository, useFactory: () => new WordRepository() }, // IWordRepository — shared repo
    { provide: JwtService, useFactory: () => new JwtService() }, // reads config in constructor
    { provide: PasswordService, useFactory: () => new PasswordService() }, // bcrypt
    { provide: GeminiClient, useFactory: () => new GeminiClient() }, // lazy singleton (reads config at call time)
    { provide: GCSClient, useFactory: () => new GCSClient() },
    { provide: GoogleTTSClient, useFactory: () => new GoogleTTSClient() },
    { provide: GeminiService, useFactory: () => new GeminiService() },
  ],
  exports: [
    PrismaClient,
    CacheService,
    ContentUtils,
    WordRepository,
    JwtService,
    PasswordService,
    GeminiClient,
    GCSClient,
    GoogleTTSClient,
    GeminiService,
  ],
})
export class SharedModule {}
```

- **`CacheService` async provider** — `CacheFactory.create("default")` is awaited at module scope in the Express container (top-level await in ESM); the Nest async `useFactory` resolves it before bootstrap completes / first request. The `CacheFactory` singleton registry stays shared where safe, or a Nest-scoped instance is created — note test-reset implications (stateful registry).
- **External clients are lazy singletons** — constructor-take-nothing, read `config` at call time (per the current implementation under `src/shared/infrastructure/external/`). This includes `GcsFileStore` (from `shared/infrastructure/storage/GcsFileStore.ts`, which today runs a top-level `new GCSClient()` at module scope) — in Nest land it is a lazy-singleton `useFactory` provider, no top-level client construction.

### Graceful shutdown — `onApplicationShutdown`

`DatabaseModule`/`SharedModule` implement Nest's `onApplicationShutdown` lifecycle hook so the shell drains cleanly on Railway restart/rollback (the R2 release-safety gate):

```typescript
@Module({ providers: [/* … */], exports: [/* … */] })
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}
  async onApplicationShutdown(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export class SharedModule implements OnApplicationShutdown {
  constructor(@Inject(CacheService) private readonly cache: CacheService) {}
  async onApplicationShutdown(): Promise<void> {
    await this.cache.getClient()?.quit(); // redisClient.quit()
    // + any cache teardown the CacheService exposes
  }
}
```

Verified by a shutdown unit test: SIGTERM → clean exit, `$disconnect`/`quit` called, no dropped connections. (SSE teardown is future epic-31, not 24.)

## Architecture Integration

```
[Story 24-4: SharedModule/DatabaseModule + Async Providers]
├── src/nest/shared/database.module.ts — PrismaClient provider (Prisma 7 CJS + PrismaPg)
├── src/nest/shared/shared.module.ts — config/CacheService(async)/contentUtils/WordRepository/
│                                      JwtService/PasswordService/GeminiClient/GCSClient/GoogleTTSClient/GeminiService
├── Express app/container.ts — UNTOUCHED (Nest has its own provider path)
└── Consumers (later stories): mnemonics (cache+gemini), auth (jwt+password), audio (cache+GCS+TTS), readers, quiz, progression
```

Dependencies: **24-3** (the parity shell). Parallel-safety: **additive** — wraps but does not edit `shared/infrastructure/*`; `shared/` is not a 25–28 zone, so no collision. Note the `check:module-boundaries` rule (`shared/` must import zero from `modules/`) — the Nest providers live in `src/nest/`, which introduces no new `shared/`→`modules/` edge.

## Technical Challenges & Solutions

### Prisma 7 CJS-only default import inside a Nest factory

```
Problem: Prisma 7 ships a CJS-only @prisma/client; the default-import + adapter pattern
        (`import prismaPkg from "@prisma/client"; const { PrismaClient } = prismaPkg`)
        must be preserved inside the Nest provider factory.
Solution: DatabaseModule provider factory replicates the exact pattern from
        `src/shared/infrastructure/database/client.ts`, including PrismaPg adapter
        passed a connection string (not a pg.Pool).
```

### `cacheService` top-level await → async provider

```
Problem: The Express container awaits CacheFactory.create("default") at module scope
        (top-level await in ESM); Nest needs the dependency resolved before first request.
Solution: Async useFactory provider (`useFactory: async () => await CacheFactory.create("default")`).
        Note the CacheFactory singleton registry is stateful — shared where safe, or a
        Nest-scoped instance with test-reset implications documented.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Provider unit tests** (`src/nest/shared/__tests__/shared-module.providers.test.ts`): `CacheService` resolves via the async `useFactory` before bootstrap completes (`Test.compile()` awaits async providers — a rejected factory fails compilation); the three config homes + `CONTENT_UTILS` are exposed as providers; `PrismaClient` is constructed exactly once (singleton); external clients resolve as lazy singletons — `GcsFileStore` delegates to the INJECTED `GCSClient` (no top-level `new GCSClient()` in Nest land). Hermetic env stubs (`REDIS_URL=""` no-op cache, `DATABASE_URL`/JWT fallbacks) with dynamic imports so module singletons evaluate against the stubbed env.
- **Graceful-shutdown tests (R2):** `DatabaseModule.onApplicationShutdown` → `PrismaClient.$disconnect()` called once; `SharedModule.onApplicationShutdown` → `redisClient.quit()` called once (CacheService exposes no teardown — the Redis client is the connection owner).
- **Boundary check:** `check:module-boundaries` green — no new `shared/`→`modules/` edge introduced by the Nest provider path (`src/nest/` files import `shared/` + `modules/audio/config.js`, but the direction rule scans only `apps/backend/src/shared/`, which still imports zero from `modules/`).
- **Existing suites:** unchanged and green; Express `app/container.ts` untouched.
- **Gates:** typecheck + `build` green (both dist entries emitted incl. `dist/nest/shared`); `lint` 0 errors; `test:full` 57/611; `test:integration` 15/112; `check:module-boundaries` green; `dev:nest` boots and the async `CacheService` resolves before routes are served.
