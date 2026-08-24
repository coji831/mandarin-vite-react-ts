**Last Updated:** August 22, 2026

# Story 24.15: Deployment Cutover + Retire Dual-Mode + Docs Refresh

## Description

**As a** backend operator,
**I want to** flip the production entry to the NestJS 11 shell — set `start`/`railway.toml`/`Procfile` to `node dist/nest/main.js` (healthcheck `/api/v1/health`), delete the entire Express surface (`src/app/` + every `modules/*/api/` controller/route/container + the `req.xController`/`req.geminiService` `express.d.ts` augmentation + the Express-only middleware), reconcile `openapi.yaml` to the live route set (9 dead routes removed; documents the 7-path System/Auth/TTS surface — expansion to all ~54 real routes is a flagged follow-up), serve `/api-docs` + `/api-docs.json` from Nest (verified 200), tighten `engines` to `>=24`, retire the now-Express-only tests (incl. `ReadersAudioController.test.ts`) while preserving coverage via the refactored Nest-only regression harnesses, refresh `docs/architecture.md` + backend conventions + `module-level-containers.md` truth-checked, and record the post-flip verification in `verification-artifacts/release-safety-gate-24-14.md`,
**So that** production boots from the Nest entry, the Express surface is gone (no dual-mode), the API/docs contract is truthful, and epics 25–28 land on NestJS.

## Business Value

This story is the **cutover** that completes the shell migration: it makes the NestJS 11 shell the **production entry** and **deletes the Express surface** — removing the dual-mode maintenance burden and every Express-specific artifact (controllers, routes, middleware, type augmentation) in one commit. It is the point at which "Nest is a dev-only proof" becomes "Nest IS the backend", giving epics 25–28 (which land on NestJS) a stable, single home. It refreshes the API/docs contract truthfully (9 dead `/v1/vocabulary/*` + `/v1/progress*` routes removed; the 7-path System/Auth/TTS surface documented) and moves the `/api-docs` + `/api-docs.json` consumer surface onto the Nest shell (verified 200), so SDK/consumer tooling keeps working. It tightens `engines` to `>=24` (closing the 24-14 R1 lower-bounds caveat), retires the Express-only tests that would otherwise cover deleted code (`ReadersAudioController.test.ts` + the Express controller/route suites) while preserving coverage with the Nest-only regression harnesses, and records the post-flip smoke + rollback verification in the release-safety artifact — the epic's final, independently verifiable "we flipped and it works" claim. The rollback is real: redeploy the previous Railway release (the migration set is additive-only, so no schema rollback is needed).

## Acceptance Criteria

- [x] **Production boots from the Nest entry** — `package.json` `start` = `node dist/nest/main.js`; `railway.toml` `startCommand` → `npm run start` with `healthcheckPath` `/api/v1/health`; `Procfile` = `web: npm run start`; `engines` tightened `>=22` → `>=24`; prod-boot smoke (`node dist/nest/main.js`, PORT=3999) green.
- [x] **Express surface deleted (no dual-mode)** — `src/app/` (`index.ts`/`routes.ts`/`container.ts`), all `modules/*/api/` controllers + route files + `container.ts`, `authMiddleware.ts`/`cacheMiddleware.ts`/`asyncHandler.ts`, and the `req.xController`/`req.geminiService` `express.d.ts` augmentation removed; `dist/app/index.js` no longer emitted by the build.
- [x] **openapi truthful** — `openapi.yaml` reconciled: 9 dead routes (`/v1/vocabulary/*` ×5 + `/v1/progress*` ×4) + 4 dead schemas + 2 dead tags removed (375 lines deleted, 0 added); the spec now documents the live 7-path System/Auth/TTS surface; the build's openapi copy step to `dist/` verified. (Expansion to all ~54 real routes is a flagged follow-up.)
- [x] **`/api-docs` + `/api-docs.json` served from Nest** — swagger-ui-express mounted in `configure-app.ts`; both verified 200 in the prod-boot smoke.
- [x] **Retired/converted tests** — Express controller/route suites retired (`test:full` 66/744 → 52/609, the delta = Express-only tests incl. `ReadersAudioController.test.ts`); the 9 parity harnesses refactored from dual-app boot to Nest-only regression guards (`test:integration` 23/262 preserved); coverage not dropped.
- [x] **Post-flip smoke green** — `/api/v1/health` 200, a guest data route 200 (`/api/v1/words/好`, `/api/v1/pinyin/search`), `/api-docs` + `/api-docs.json` 200, a 404 with the `{code, message, requestId}` envelope, a guest 401 `AUTH_REQUIRED`; the verification record appended to `verification-artifacts/release-safety-gate-24-14.md`.

## Business Rules

1. **Rollback is real** — after the flip, rollback = redeploy the previous Railway release (Railway keeps prior releases, one-click); the epic's migration set is additive-only (single 24-11 `SrsCardState` migration), so no schema rollback is ever needed; the Express production entry was deleted by design at cutover (the 24-14 `start:express` escape hatch no longer exists).
2. **The API/docs contract must be truthful** — `openapi.yaml` may document only routes that exist in `ROUTE_PATTERNS`; dead routes are removed, not documented; `/api-docs` is either served from Nest or its removal documented (served here).
3. **The watch window precedes deletion** — per 24-14, the Express surface is deleted only after the release-safety gate's pre-flight sign-off PASSES (S1 + S2 + P1 100% + T1) and the post-flip smoke is green; the watch-window procedure (≥24–48h observing the 24-3 requestId logs) governs the window.
4. **Coverage is preserved, not dropped** — retiring Express-only tests must not reduce live coverage: the parity harnesses are refactored to Nest-only regression guards at the same integration count (23/262), and the Express controllers' unique behavior (e.g. `ReadersController.getPassageAudio`) remains covered.
5. **`validateConfig()` fail-fast preserved on Nest boot** — config validation still runs before `NestFactory.create`.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.14: Release-Safety Cutover Gate** ([BR](story-24-14-release-safety-cutover-gate.md)) (dependency — the pre-flight gate that unblocked this flip; its DoD verification + post-flip smoke/rollback/watch-window procedure is the cutover's safety contract; this story appends the post-flip record to its artifact)
- **Story 24.2: NestJS 11 Shell Scaffold** ([BR](story-24-2-nest-shell-scaffold-proof.md)) (the shell this cutover promotes to production)
- **Story 24.3: HTTP-Layer Parity** ([BR](story-24-3-http-layer-parity.md)) (the envelope/requestId/rate-limit contract the post-flip smoke asserts; the requestId logs the watch window observes)
- **Story 24.9: Radicals + Foundations Port** ([BR](story-24-9-radicals-foundations-port.md)) (route-shadowing parity the cutover preserves)
- **Story 24.10: Audio + Health Port** ([BR](story-24-10-audio-health-port.md)) (O2 — the healthcheck the prod boot verifies)
- **Epic 26** (quiz-FE fixes, C-declared) · **Epic 27** (gate/phase data + HSK, C) · **Epic 39** (full observability spine, C) — the C-declared items that land on the shipped NestJS shell
- **Implementation (IMP twin):** `story-24-15-deployment-cutover.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-15-deployment-cutover.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `011a6c6d` (cutover impl) · docs-close `5834a51e` (epic-close commit)
- **Implementation note:** the cutover shipped in commit `011a6c6d` — production entry flipped to Nest (`start`/`railway.toml`/`Procfile` → `node dist/nest/main.js`, healthcheck `/api/v1/health`), the Express surface deleted (`src/app/` + all `modules/*/api/` + the `req.xController`/`req.geminiService` `express.d.ts` augmentation + `authMiddleware`/`cacheMiddleware`/`asyncHandler`), `openapi.yaml` reconciled (9 dead routes + 4 dead schemas + 2 dead tags removed; documents the 7-path System/Auth/TTS surface — expansion to all ~54 real routes is a flagged follow-up), `/api-docs` + `/api-docs.json` served from Nest (verified 200), `engines` tightened to `>=24`, `ReadersAudioController.test.ts` + the Express controller/route suites retired with coverage preserved (test:full 52/609; the 9 parity harnesses refactored to Nest-only regression guards, test:integration 23/262), `docs/architecture.md` + backend conventions + `module-level-containers.md` updated + truth-checked, and the post-flip verification recorded in `verification-artifacts/release-safety-gate-24-14.md`. All ACs verified against the shipped commit.
