**Last Updated:** August 21, 2026

# Implementation 24-15: Deployment Cutover + Retire Dual-Mode + Docs Refresh

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-15-deployment-cutover.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `011a6c6d` (the cutover impl commit; the docs-close hash is filled on the epic-close commit)

## Implementation Summary

Flipped the backend production entry to the NestJS 11 shell (commit `011a6c6d`) — the **final story of Epic 24**. `package.json` `start` → `node dist/nest/main.js` (`railway.toml` `startCommand` → `npm run start`, `healthcheckPath` `/api/v1/health`, `Procfile` `web: npm run start`); `engines` tightened `>=22` → `>=24`. The **entire Express surface was deleted**: `src/app/` (`index.ts`/`routes.ts`/`container.ts`), all `modules/*/api/` controllers/routes/`container.ts`, `authMiddleware.ts`/`cacheMiddleware.ts`/`asyncHandler.ts`, and the `req.xController`/`req.geminiService` `express.d.ts` augmentation. `openapi.yaml` was reconciled (9 dead routes + 4 dead schemas + 2 dead tags removed, 375 lines deleted / 0 added — the spec now documents the 7-path System/Auth/TTS surface; expansion to all ~54 real routes is a flagged follow-up). `/api-docs` + `/api-docs.json` are served **from Nest** via swagger-ui-express (both verified 200). Express-only tests were retired (`ReadersAudioController.test.ts` included) with coverage preserved — the 9 parity harnesses were refactored from dual-app boot to **Nest-only regression guards**. `docs/architecture.md` + backend conventions §4 + `module-level-containers.md` were updated + truth-checked. The post-flip verification record was appended to `verification-artifacts/release-safety-gate-24-14.md`.

## Technical Scope

Flip the deploy contract to Nest, delete the Express surface, reconcile the API/docs contract, preserve coverage while retiring Express-only tests, and record the post-flip verification in the release-safety artifact.

**Files:**

- `apps/backend/package.json` — `start`/`dev` → Nest entry (`node dist/nest/main.js` / `tsx watch src/nest/main.ts`); `engines.node` `>=22` → `>=24`
- `apps/backend/railway.toml` — comment documenting the Nest production entry + Express deletion + rollback (redeploy previous release); `startCommand` → `npm run start`; `healthcheckPath` `/api/v1/health` unchanged
- `apps/backend/src/nest/main.ts` — re-documented as the **production** entrypoint (was dev-only proof); `/api-docs` + graceful shutdown notes
- `apps/backend/src/nest/configure-app.ts` — **NEW**: mounts `/api-docs` (swagger-ui-express) + `/api-docs.json` on the Express adapter, preserving the consumer surface deleted with Express; imports `swaggerSpec` from `src/shared/docs/openapi.js`
- `apps/backend/src/nest/rate-limit.config.ts` — `words` limiter `keyGenerator` fixed to use the `ipKeyGenerator` helper (bare `req.ip` rejected by express-rate-limit's `ERR_ERL_KEY_GEN_IPV6` guard — would crash the prod boot)
- `apps/backend/src/shared/types/express.d.ts` — `req.xController`/`req.geminiService` augmentation removed (Express surface gone); `userId`/`user`/`requestId` kept for the Nest guards
- `apps/backend/src/shared/docs/openapi.yaml` — reconciled: 9 dead routes + 4 dead schemas + 2 dead tags removed (375 lines); documents the 7-path System/Auth/TTS surface
- `apps/backend/src/app/*` — **DELETED**: `index.ts`, `routes.ts`, `container.ts`
- `apps/backend/src/modules/*/api/*` + `modules/*/container.ts` — **DELETED**: every Express controller/route/container (`AuthController`/`authRoutes` … `WordsController`/`WordsRoutes`)
- `apps/backend/src/shared/middleware/{authMiddleware,cacheMiddleware,asyncHandler}.ts` — **DELETED** (Express-only middleware)
- `apps/backend/src/modules/*/index.ts` — barrel re-exports trimmed of the deleted `api/` surface
- `apps/backend/src/modules/*/nest/*` — Nest controllers/modules updated (imports, `index.ts` re-export paths)
- `apps/backend/tests/integration/nest/*.test.ts` (9 parity harnesses) — refactored from dual-app (Express+Nest) boot to **Nest-only regression guards**
- `apps/backend/src/modules/*/api/__tests__/*` — **RETIRED**: Express controller/route test suites (incl. `ReadersAudioController.test.ts`)
- `docs/architecture.md`, `docs/guides/conventions/backend.md` (§4), `docs/knowledge-base/backend/module-level-containers.md` — updated + truth-checked for the Nest production surface
- `verification-artifacts/release-safety-gate-24-14.md` — post-flip verification record appended (force-added; `verification-artifacts/` is gitignored)

## Implementation Details

### Production entry flip + `engines` tighten (R1 caveat closed)

```jsonc
// apps/backend/package.json (24-15)
"engines": { "node": ">=24" },            // was >=22 — closes the 24-14 R1 lower-bounds caveat
"scripts": {
  "dev":  "tsx watch src/nest/main.ts",   // was src/app/index.ts
  "start": "node dist/nest/main.js",      // was node dist/app/index.js — NEST is now production
  "start:nest": "node dist/nest/main.js"  // alias kept
}
```

`railway.toml` `startCommand` → `npm run start --workspace=@mandarin/backend` (→ Nest), `healthcheckPath` `/api/v1/health` unchanged, `preDeployCommand` `npm run db:migrate:deploy` (the additive-only set, §D1). `Procfile` = `web: npm run start` (→ Nest). `src/nest/main.ts` is re-documented as the **production** entrypoint — `validateConfig()` still runs before `NestFactory.create` (fail-fast preserved), and `app.enableShutdownHooks()` (wired in `configure-app.ts`) fires the `DatabaseModule`/`SharedModule` shutdown hooks on SIGTERM.

### Express surface deletion (no dual-mode)

The cutover deleted every Express artifact in one commit (111 files, −10,119 lines):

- **`src/app/`** — `index.ts`, `routes.ts`, `container.ts` deleted; `dist/app/index.js` is **no longer emitted** by the build (only `dist/nest/main.js`, 2305 B).
- **All `modules/*/api/` controllers + route files + `container.ts`** deleted (`AuthController`/`authRoutes` … `WordsController`/`WordsRoutes`), with each module's `index.ts` barrel trimmed and the `nest/` controllers/modules updated. The 24-14 `start:express` escape hatch no longer exists **by design** — rollback is redeploy-previous only.
- **Express-only middleware deleted** — `authMiddleware.ts`, `cacheMiddleware.ts`, `asyncHandler.ts`; `errorHandler.ts` trimmed to what the shared error-resolution helpers need.
- **`express.d.ts` cleaned** — the `req.xController`/`req.geminiService` controller-injection augmentation removed (74 → 26 lines); `userId`/`user`/`requestId` **kept** (the Nest guards `src/nest/guards/*` attach them and the Nest controllers + rate-limit config read them on the Express adapter).

### openapi reconciliation + `/api-docs` from Nest

```typescript
// apps/backend/src/nest/configure-app.ts (24-15) — the consumer surface preserved on Nest
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../shared/docs/openapi.js";
// ...
expressApp.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
expressApp.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
```

- **`openapi.yaml` reconciled** (375 lines deleted, 0 added): the **9 dead routes** (`/v1/vocabulary/lists`, `/v1/vocabulary/lists/{listId}`, `/v1/vocabulary/lists/{listId}/progress`, `/v1/vocabulary/lists/{listId}/words`, `/v1/vocabulary/search` ×5 + `/v1/progress`, `/v1/progress/{wordId}`, `/v1/progress/batch`, `/v1/progress/stats` ×4) + **4 dead schemas** (`VocabularyList`, `VocabularyWord`, `Progress`, `ListProgress`) + **2 dead tags** (`Vocabulary`, `Progress`) removed — none exist in `ROUTE_PATTERNS`. The spec now documents the live **7-path System/Auth/TTS surface** (`/v1/health` + auth register/login/refresh/logout/me + `/v1/tts`). The build's openapi copy step to `dist/` verified.
- **`/api-docs` decision: SERVE FROM NEST** — swagger-ui-express mounted on the Express adapter before the error bridge (mirroring the former Express ordering). Both `/api-docs` (swagger-ui HTML) and `/api-docs.json` (OpenAPI 3.1.0 spec) verified **200** in the prod-boot smoke.
- **Follow-up (flagged, not in-commit):** the spec was never a full 63-route spec — expanding it to document all ~54 real routes is a follow-up, not part of this commit.

### Coverage preservation (retired Express tests → Nest-only regression guards)

`test:full` went **66 files / 744 tests → 52 files / 609 tests** — the entire delta is the **retired Express controller/route suites** (e.g. `authController.test.ts`, `ProgressionController.test.ts`, `QuizController.test.ts`, `ReadersController.test.ts`, `ReadersAudioController.test.ts` — the latter uniquely covered the live Express `getPassageAudio` and was deferred from 24-11/24-12 precisely so it could retire here without dropping live coverage). `test:integration` stayed **23 files / 262 tests**: the 9 parity harnesses were refactored from **dual-app (Express+Nest) boot** to **Nest-only regression guards** — they now assert the Nest app's behavior against the frozen expectations, preserving the parity semantics that the dual-app boot previously proved, at the same integration count.

## Architecture Integration

```
[Story 24-15: Deployment Cutover + Retire Dual-Mode + Docs Refresh] — PRODUCTION FLIP (commit 011a6c6d)
├── Deploy contract flipped to Nest:
│     package.json start/dev → node dist/nest/main.js · railway.toml startCommand → npm run start
│     healthcheckPath /api/v1/health · Procfile web: npm run start · engines >=24
├── Express surface DELETED (no dual-mode):
│     src/app/ (index/routes/container) · modules/*/api/* + container.ts · authMiddleware/
│     cacheMiddleware/asyncHandler · req.xController/req.geminiService express.d.ts augmentation
├── API/docs contract reconciled:
│     openapi.yaml — 9 dead routes + 4 dead schemas + 2 dead tags removed (7-path System/Auth/TTS)
│     /api-docs + /api-docs.json served from Nest (swagger-ui-express, verified 200)
├── Coverage preserved:
│     Express controller/route suites retired (test:full 66/744 → 52/609) · 9 parity harnesses
│     refactored dual-app → Nest-only regression guards (test:integration 23/262 preserved)
├── Docs refreshed + truth-checked: docs/architecture.md · backend conventions §4 ·
│     module-level-containers.md (retired) · post-flip record in release-safety-gate-24-14.md
├── Gated by 24-14: pre-flight sign-off (S1 + S2 + P1 100% + T1) PASS → this flip UNBLOCKED
└── Enables: epics 25–28 land on the shipped NestJS shell (serial plan, D10)
```

Dependencies: **24-14** (the release-safety gate — its pre-flight sign-off is the hard gate this flip cannot happen without; its input list — Node 24 prod-boot validation + `engines` tighten, openapi refresh + 9 dead-route removal, `/api-docs` decision, docs refresh, `ReadersAudioController.test.ts` retirement + Express deletion + `/gates` GUEST unification — is exactly what this story executed) and the accumulated port stories **24-2…24-13** (the Nest surface now in production). It is the **final story of Epic 24** — after this commit the shell is production and the migration is complete. Parallel-safety: the cutover is intentionally a single atomic commit — no module is left half-Express/half-Nest; `check:module-boundaries` green. Consumers: **epics 25–28** (land on the shipped shell) and **epic closing** (BR/IMP status + commit-hash finalization).

## Technical Challenges & Solutions

### `express-rate-limit` IPv6-bypass guard would crash the production boot

```
Problem: The `words` limiter configs used a bare `req.ip` fallback in their
  custom keyGenerator. express-rate-limit rejects that form via its
  ERR_ERL_KEY_GEN_IPV6 validation (an IPv6-bypass guard), which would throw
  at boot — a production-boot crash the 24-14 gate did not exercise (the words
  limiter was path-scoped and never hit in the parity boot smoke).
Solution: Re-pointed the two `words` limiter keyGenerators at the existing
  `ipKeyGenerator(req.ip || "unknown")` helper (the same form the mnemonics/
  readers configs use), which satisfies the library's validation and preserves
  the real-IP semantics. Verified: `node dist/nest/main.js` boots and the
  post-flip smoke hits the words route 200.
```

### The `/api-docs` consumer surface after Express deletion

```
Problem: The Express `app/index.ts` served `/api-docs` (swagger-ui-express) +
  `/api-docs.json`. Deleting the Express surface removed the consumer surface;
  the 24-14 gate left the "serve-from-Nest-or-remove" decision to this story.
Solution: Decision = SERVE FROM NEST. `configure-app.ts` mounts
  `swaggerUi.serve`/`setup(swaggerSpec)` at `/api-docs` + a `/api-docs.json`
  GET, on the Express adapter before the error bridge (mirroring the former
  Express ordering), importing `swaggerSpec` from `src/shared/docs/openapi.js`
  (the compiled form of `openapi.ts`, which reads the reconciled YAML). Both
  verified 200 in the smoke — no consumer break.
```

### openapi reconciliation — remove dead routes without inventing new ones

```
Problem: `openapi.yaml` documented 9 routes that exist in neither
  ROUTE_PATTERNS nor the (pre-cutover) Express registry — dead docs.
Solution: Deleted the 9 dead routes + 4 dead schemas + 2 dead tags (375 lines,
  0 added), leaving the truthful 7-path System/Auth/TTS surface. The spec was
  never a full 63-route spec, so the reconciliation is honest about what it
  documents; expanding it to all ~54 real routes is a flagged follow-up (the
  parity harnesses, not the spec, remain the route-truth source).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — the 7 documented paths (`/v1/health`, `/v1/auth/register|login|refresh|logout|me`, `/v1/tts`) reconciled against `ROUTE_PATTERNS` + the current `openapi.yaml`; the 9 removed routes are explicitly documented as **dead** (not present in `ROUTE_PATTERNS`), never as live; `/api` prefix applied by the shell
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — all 15 module dirs (`audio`, `auth`, `characters`, `chengyu`, `foundations`, `grammar`, `health`, `mnemonics`, `phonetic-clusters`, `progression`, `quiz`, `radicals`, `readers`, `review`, `words`) reconciled; the deleted `api/` surfaces + `express.d.ts` augmentation + `swaggerSpec`/`openapi.js`/`openapi.ts` verified from the shipped commit
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — the cutover is deploy/contract work; the routes served by Nest use the same repositories/services (shared Prisma singleton) verified in 24-2…24-13; no data-source claim changed
- [x] All relative markdown links resolve — the IMP twin (`../../issue-implementation/...`) and the story-BR cross-links (24-2/24-3/24-9/24-10/24-14) resolve; the epic BR README exists
- [x] Last Updated / Last Update date is current (same commit as the edit)
- [x] **Truth-check corrections:** (1) `start:express` is NOT an npm script — the 24-14 "escape hatch" was "run the Express entry `node dist/app/index.js`"; at 24-15 that entry is **deleted**, so rollback is documented as **redeploy-previous Railway release** only (matching the committed `railway.toml` comment + post-flip record); (2) the gate numbers (66/744 → 52/609 unit, 23/262 integration) are re-derived from the post-flip verification record, not copied from 24-14; (3) `openapi.yaml` path set re-derived by listing the current file (`/v1/health` + 5 auth + `/v1/tts` = 7), matching the artifact §5.

## Testing Implementation

The cutover is a **production-flip story** — the "testing" is the post-flip verification record appended to `verification-artifacts/release-safety-gate-24-14.md` (the story's verification deliverable, force-added; `verification-artifacts/` is gitignored). Exact results from the record (run 2026-08-22 from `apps/backend`):

| Gate              | Command                                    | Exact result                                                                                                                                               |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build             | `npm run build`                            | ✅ exit 0 — `dist/nest/main.js` (2305 B) emitted; `dist/app/index.js` **no longer emitted** (src/app deleted); openapi copy step passed                    |
| Full unit suite   | `npm run test:full` (`vitest run`)         | ✅ **52 files / 609 tests passed** (4.61s) — down from 24-14's 66/744: the Express controller/route tests were retired at cutover                          |
| Integration suite | `npm run test:integration`                 | ✅ **23 files / 262 tests passed** (73.37s) — same count as 24-14; the 9 parity harnesses refactored from dual-app boot to **Nest-only regression guards** |
| Lint (changed)    | `npx eslint <34 changed backend TS files>` | ✅ **0 errors** (9 warnings = `tests/integration/nest/*` files the backend ESLint config intentionally ignores — pre-existing)                             |
| Module boundaries | `npm run check:module-boundaries`          | ✅ exit 0 — "All shared imports respect the direction rule (shared never imports features/modules); naming guard clean"                                    |
| Typecheck         | `npx tsc --noEmit` (via build)             | ✅ exit 0                                                                                                                                                  |

**Prod-boot smoke** (`node dist/nest/main.js`, PORT=3999, `.env.local`): config validated, Redis connected, all 17 modules initialized, `Nest production server running on port 3999` →

| Request                                   | Result                                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`                      | ✅ **200** `{"status":"ok", ..., "services":{"gemini":true,"tts":true}, "cache":{"redis":{"connected":true}}}` |
| `GET /api/v1/words/好` (guest)            | ✅ **200** word payload (`w_00138` 好 hao3)                                                                    |
| `GET /api/v1/pinyin/search?q=hao` (guest) | ✅ **200** `{query, totalResults:35, page, pageSize, results[]}`                                               |
| `GET /api-docs` (swagger-ui)              | ✅ **200** HTML (`swagger-ui` present)                                                                         |
| `GET /api-docs.json` (spec)               | ✅ **200** OpenAPI 3.1.0 spec                                                                                  |
| `GET /api/v1/nonexistent-route`           | ✅ **404** `{"code":"INTERNAL_ERROR","message":"Cannot GET ...","requestId":"..."}` — envelope intact          |
| `GET /api/v1/review/due-count` (no token) | ✅ **401** `{"code":"AUTH_REQUIRED","message":"Please sign in to access this feature","requestId":"..."}`      |

**Rollback (per the record):** redeploy the **previous Railway release** (one-click; no code change); **no schema rollback** — the epic's migration set is additive-only (single 24-11 `SrsCardState` migration, `migrate status` 30 up-to-date); the Express production entry was **deleted** at cutover, so rollback = previous-release redeploy only. The watch-window procedure (≥24–48h observing the 24-3 requestId logs) governs the pre-deletion window per 24-14.
