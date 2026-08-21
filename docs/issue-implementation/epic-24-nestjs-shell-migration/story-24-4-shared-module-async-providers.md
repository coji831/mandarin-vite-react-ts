**Last Updated:** August 21, 2026

# Implementation 24-4: SharedModule/DatabaseModule + Async Providers

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-4-shared-module-async-providers.md`
> **Last Updated:** August 21, 2026
> **Status:** Planned

## Technical Scope

Expose the shared infrastructure as Nest providers so cache/gemini/jwt-dependent modules can be ported: `DatabaseModule` → `PrismaClient` (handling the Prisma 7 CJS-only default-import + `PrismaPg` connection-string adapter inside the factory); `SharedModule` → `config` (readonly from `src/shared/config`), `CacheService` via async `useFactory` (`await CacheFactory.create("default")` — resolves the top-level-await), `contentUtils`, shared `WordRepository` (`IWordRepository`), `JwtService`, `PasswordService`, and external clients (`GeminiClient`, `GCSClient`, `GcsFileStore`, `GoogleTTSClient`, `GeminiService`) as lazy-singleton providers. Both modules implement **graceful shutdown** (`onApplicationShutdown`: `PrismaClient.$disconnect()`, `redisClient.quit()`, cache teardown). The Express `app/container.ts` is untouched; Nest gets its own provider path.

**Files:**

- `apps/backend/src/nest/shared/database.module.ts` — **NEW**: `DatabaseModule` exposing the `PrismaClient` provider (Prisma 7 CJS pattern + `PrismaPg`).
- `apps/backend/src/nest/shared/shared.module.ts` — **NEW**: `SharedModule` exposing `config`, `CacheService` (async `useFactory`), `contentUtils`, `WordRepository`, `JwtService`, `PasswordService`, external clients.
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import `SharedModule`/`DatabaseModule` (global or per-module as decided) so later module ports consume them.
- `apps/backend/src/nest/**/__tests__/*.test.ts` — **NEW**: unit tests for the async provider (CacheService resolves before bootstrap; PrismaClient constructed once; lazy external clients).

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

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Provider unit tests:** `CacheService` resolves via the async provider before bootstrap/first request; `PrismaClient` constructed exactly once (singleton); external clients lazy-initialize (no construction until first use); **`GcsFileStore`/`GCSClient` resolve as lazy-singleton providers** (no top-level `new GCSClient()` in Nest land).
- **Graceful-shutdown test (R2):** SIGTERM → `PrismaClient.$disconnect()` + `redisClient.quit()` + cache teardown called; clean exit.
- **Boundary check:** `npm run check:module-boundaries` green — no new `shared/`→`modules/` edge introduced by the Nest provider path.
- **Existing suites:** unchanged and green; Express `app/container.ts` untouched.
- **Gates:** Tier 1 `build`/`lint` (0 errors)/`test`; Tier 2 `test:full`/`typecheck`/`check:module-boundaries`/`test:integration`.
