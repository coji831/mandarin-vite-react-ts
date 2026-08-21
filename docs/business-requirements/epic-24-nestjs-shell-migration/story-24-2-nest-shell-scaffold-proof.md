**Last Updated:** August 21, 2026

# Story 24.2: NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern

## Description

**As an** engineering lead,
**I want to** bootstrap the backend on a dev-only NestJS 11 shell (Express platform adapter) and port four zero-dependency reference modules (`words`, `phonetic-clusters`, `grammar`, `chengyu`) as Nest modules — reusing the existing services/repositories unchanged — verified by a route-response parity harness against the still-production Express app,
**So that** the D7 mechanical shell-swap pattern (DI, routing, Prisma, parity) is proven risk-free before any production cutover, without blocking or colliding with epics 25–28.

## Business Value

This is the executable first story of Epic 24 (D7 shell-swap). It de-risks the entire NestJS 11 migration by proving, end-to-end and dev-only, that a module's Express factory + controller can be mechanically replaced by a Nest `@Module` + controller while reusing the same framework-agnostic services and repositories — with zero production risk and zero collision with epics 25–28 (which are actively changing review/quiz/audio/progression/radicals/foundations/`authMiddleware`/`shared-constants`/Prisma schema). The four reference modules (`words`, `phonetic-clusters`, `grammar`, `chengyu`) are deliberately zero-collision and exercise every DI/HTTP surface the pattern needs (bare controller, list/detail, param routing, Prisma-backed repository, multi-provider module). A green parity harness here means every later port (24-3…24-15) is a mechanical repetition of a proven pattern, and the `dist/app/index.js` Express production path is untouched so there is no user-facing risk.

## Acceptance Criteria

- [x] Nest 11 deps added (`@nestjs/common`/`@nestjs/core`/`@nestjs/platform-express` `^11` + `reflect-metadata`; dev `@nestjs/testing` `^11`) + `experimentalDecorators`/`emitDecoratorMetadata` in `apps/backend/tsconfig.json` (inherited by all configs); `src/nest/main.ts` + `src/nest/app.module.ts` boot on the Express adapter with the identical CORS allowlist, `trust proxy 1`, cookie parsing, and `/api` global prefix; `dev:nest`/`start:nest` scripts run it. Deliberately absent: `@nestjs/config`, `@nestjs/throttler`, `@nestjs/swagger`, `nest-cli.json`.
- [x] Express production path unchanged: `npm run build` still emits `dist/app/index.js`; `railway.toml`/`Procfile`/`start` untouched and the Express entry still boots.
- [x] `words`, `phonetic-clusters`, `grammar`, `chengyu` ported as Nest modules under `modules/<name>/nest/` reusing the existing services/repos unchanged; Nest controllers return the exact success JSON + status of their Express counterparts for all their `ROUTE_PATTERNS` paths; 4xx status matches (body-envelope parity deferred to 24-3).
- [x] Parity harness `tests/integration/nest/route-parity.test.ts` passes under `vitest.integration.config.ts` (identical 2xx body + status, identical 4xx status across all ported routes); excluded from Tier-1 changed-scope; skip-with-message guard when `DATABASE_URL` is absent. The covered set includes `WordsRoutes.ts` (uppercase filename — the Express words route file is `apps/backend/src/modules/words/api/WordsRoutes.ts`).
- [x] **Test baseline is an epic-level hard precondition (T1)**: `npm run test:full` + `npm run test:integration` are run and the real pass/fail is **recorded and triaged in a verification artifact before any 24-2 work starts** — the prior "green" claim is unverified; failures are triaged (fix or documented) before scaffolding begins.
- [x] Node engine reconciled to 24 LTS (`engines`, `.node-version`, `.nvmrc`); `npm ls express` shows a single 5.x version; `npm run check:module-boundaries` green (no new `shared/`→`modules/` edge).
- [x] No `SharedModule` introduced; no changes to auth/guards, the `{code, message, requestId}` envelope, requestId, rate-limit config, `progression↔quiz` DI, or any 25–28 collision zone (review/quiz/audio/progression/radicals/foundations/`authMiddleware`/`shared-constants`/Prisma schema); baseline tests stay green.
- [x] Gates green: `npm run build`, `npm run lint` (0 errors), `npm run typecheck --workspace=@mandarin/backend`, `npm test`, `npm run test:full`, `npm run test:integration`.

## Business Rules

1. **Dev-only dual-mode (load-bearing)** — the Nest shell is proof-only and never production until the 24-15 cutover. Express (`node dist/app/index.js` via `railway.toml`/`Procfile`/`start`) remains the production entry through this story.
2. **`useFactory` + `@Inject()` providers, not auto-param injection** — `tsx` (esbuild) emits no decorator metadata, so Nest's auto constructor-param injection will not resolve in the dev loop. Use explicit `useFactory` providers + `@Inject()` decorators (the documented mapping in `docs/knowledge-base/backend/module-level-containers.md`); set the tsconfig decorator flags anyway so the compiled build gets metadata.
3. **Parity copies patterns from route files, not `ROUTE_PATTERNS` builders** — `ROUTE_PATTERNS` are URL builders with interpolated values; the literal path shapes (`:glyph`, `:id/measure-words`, `:id`, etc.) live in the route files under `apps/backend/src/modules/*/api/` and the Nest `@Get(...)` patterns must reproduce them.
4. **Express wiring untouched** — `modules/<name>/container.ts`, `api/*Controller.ts`, `api/*Routes.ts`, `src/app/container.ts`, `src/app/routes.ts`, `src/shared/types/express.d.ts` are all unchanged; Nest controllers bypass `req.xController` entirely and call the same services.
5. **No `SharedModule` in this story** — the four reference modules' repositories self-import the Prisma singleton (`new WordsRepository()` etc.), so no shared infra module is needed; `SharedModule`/`DatabaseModule` is introduced in 24-3 when cache/gemini/jwt-dependent modules are ported.
6. **Baseline first (epic-level hard precondition)** — record the real full + integration test pass/fail in a verification artifact and triage any failures before starting 24-2 work (the 2026-08-21 "green" claim is unverified); this is the T1 foundation for the whole migration.
7. **Shared-track single-PR discipline** — the only shared-track files touched are `apps/backend/package.json`/`package-lock.json` + `apps/backend/tsconfig.json`; land via a single PR and do not delete/rename any file epics 25–28 reference.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.3: HTTP-Layer Parity** ([BR](story-24-3-http-layer-parity.md)) (successor — inherits the parity harness, adds envelope/requestId/rate-limit)
- **Story 24.4: SharedModule/DatabaseModule + Async Providers** ([BR](story-24-4-shared-module-async-providers.md)) (successor — builds the DI substrate on the shell)
- **Implementation (IMP twin):** `story-24-2-nest-shell-scaffold-proof.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-2-nest-shell-scaffold-proof.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `2dd55c0e`
- **Implementation note:** NestJS 11 dev-only shell booted on the Express adapter via `src/nest/main.ts` + `src/nest/app.module.ts` + the shared `configure-app.ts` boot shape; four reference modules (`words`, `phonetic-clusters`, `grammar`, `chengyu`) ported under `modules/<name>/nest/` with `useFactory` + `@Inject` reusing the existing services/repos unchanged; 23-assertion route-parity harness green under `vitest.integration.config.ts`; Express production path untouched (`dist/app/index.js` still emitted). All 8 ACs verified against the shipped code — commit hash deferred to epic close.
