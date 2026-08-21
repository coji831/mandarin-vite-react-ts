**Last Updated:** August 21, 2026

# Story 24.4: SharedModule/DatabaseModule + Async Providers

## Description

**As a** backend engineer,
**I want to** expose the shared infrastructure (`config`, `PrismaClient`, `CacheService`, `contentUtils`, shared `WordRepository`, `JwtService`, `PasswordService`, external clients) as NestJS providers — with `CacheService` and `PrismaClient` resolved via async `useFactory` providers,
**So that** cache/gemini/jwt-dependent modules (`mnemonics`, `auth`, `readers`, `audio`, `quiz`, `progression`) can be ported onto the shell without touching the Express `app/container.ts`.

## Business Value

This is the third unblocked story (sits on 24-3). It is the DI substrate of the Nest shell: without it, every later module port would have to re-create shared singletons or reach back into the Express container, defeating the purpose of the shell-swap. It resolves the two hardest DI obstacles of the migration — the Prisma 7 CJS-only default-import + `PrismaPg` connection-string adapter, and the `cacheService` **top-level `await`** in the Express composition root — as Nest async providers, so the shell is a self-contained dependency graph. It is additive: it wraps (does not edit) `shared/infrastructure/*`, so the Express path and epics 25–28 are untouched.

## Acceptance Criteria

- [ ] `SharedModule`/`DatabaseModule` compile + boot inside the Nest shell; `CacheService` resolves via async provider before the first request.
- [ ] **Graceful shutdown (R2)**: `SharedModule`/`DatabaseModule` implement `onApplicationShutdown` — `PrismaClient.$disconnect()`, `redisClient.quit()`, and cache teardown on SIGTERM — with a shutdown unit test (SIGTERM → clean exit, no dropped connections).
- [ ] **`GcsFileStore`/external clients as lazy-singleton providers** — no top-level `new GCSClient()` in Nest land (`GcsFileStore.ts` today instantiates `new GCSClient()` at module scope); `GcsFileStore` + `GCSClient` are exposed as lazy-singleton `useFactory` providers (constructor-take-nothing, read `config` at call time).
- [ ] No new `shared/`→`modules/` edge (`check:module-boundaries` green); Express `app/container.ts` untouched.
- [ ] Providers unit-tested (Prisma client singleton, cache async resolution, lazy external clients, shutdown hooks).
- [ ] No 25–28 collision-zone file touched.

## Business Rules

1. **Async `useFactory` for `CacheService`** — `CacheService` is created via `await CacheFactory.create("default")` in the Express container (top-level await in ESM); in Nest it becomes an async `useFactory` provider so it resolves before bootstrap completes and before the first request.
2. **Prisma 7 CJS-only pattern preserved** — the `DatabaseModule` `PrismaClient` provider uses the same known-gotcha pattern as `src/shared/infrastructure/database/client.ts`: `import prismaPkg from "@prisma/client"; const { PrismaClient } = prismaPkg` + `PrismaPg({ connectionString: config.databaseUrl })` (adapter passed a connection string, not a custom `pg.Pool`).
3. **Express `app/container.ts` untouched** — Nest gets its own provider path; the `CacheFactory` singleton registry stays shared where safe, or a Nest-scoped instance is created (note test-reset implications).
4. **Additive, not editing** — the story wraps but does not edit `shared/infrastructure/*`; `shared/` is not a 25–28 zone.
5. **Graceful shutdown on `onApplicationShutdown`** — the migration's deployable services must drain cleanly on Railway restart/rollback: `PrismaClient.$disconnect()`, `redisClient.quit()`, cache teardown (SSE teardown is future epic-31, not 24).
6. **External clients are lazy singletons** — `GcsFileStore`/`GCSClient`/`GoogleTTSClient`/`GeminiClient` become `useFactory` providers (no top-level `new GCSClient()` in Nest land — today `shared/infrastructure/storage/GcsFileStore.ts` instantiates one at module scope).
7. **No new module edges** — providers must not introduce new `shared/`→`modules/` imports (`scripts/check-module-boundaries.mjs` stays green).

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.3: HTTP-Layer Parity** ([BR](story-24-3-http-layer-parity.md)) (dependency — parity shell)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-5--auth-surface-guards-calibrated)) (consumer — `JwtService`/`PasswordService` from `SharedModule`)
- **Story 24.8: Characters + Mnemonics Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-8--characters--mnemonics-port)) (consumer — cache + gemini providers)
- **Implementation (IMP twin):** `story-24-4-shared-module-async-providers.md` → `../../../issue-implementation/epic-24-nestjs-shell-migration/story-24-4-shared-module-async-providers.md`

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
