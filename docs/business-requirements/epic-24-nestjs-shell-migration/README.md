---
purpose: NestJS 11 shell-swap — full-scoped serial Epic 24 runs FIRST to completion (15 stories), then epics 25–28 land on NestJS
status: planned
last-verified: 2026-08-21
type: epic
---

# Epic 24: NestJS Shell Migration

## Epic Summary

**Goal:** Migrate the backend to a NestJS 11 shell via the **D7 shell-swap** — a **full-scoped serial** Epic 24 that runs **FIRST, to completion** (15 stories, fully self-contained), absorbing the P0-1 security stopgap, calibrated guest identity, and the additive `SrsCardState` schema; epics 25–28 then land **on NestJS after**. **D1 = NestJS 11**, owner-approved **2026-08-17**; serial sequencing re-ratified **2026-08-21** (D9).

**Key Points:**

- D7 = shell-swap to NestJS 11 early — **not** a greenfield rebuild, **not** a full migrate
- Runs **FIRST to completion** (serial, 15 stories); then epics 25–28 land on NestJS — **supersedes the "parallel with 25–28" clause (owner re-ratification 2026-08-21, D9)**
- Absorbs release-safety items within the epic: P0-1 stopgap (24-1) + structural fix (24-11), calibrated guest identity + minimal FE lockstep (24-7), additive `SrsCardState` schema/vector (24-11); quiz-FE fixes are C-declared (tracked in 26)
- Builds the calibrated substrate (AI gateway E.0–E.2, retrieval seam, tracking) as epics land on the shell
- Modulith + SSE/gateway/quota/DI all land on NestJS
- Decisive for NestJS 11: ts-fsrs FE+BE bit-identical parity via the shared TS kernel `@mandarin/srs-core`; mechanical shell migration; keeps Zod + `shared-types`
- ⚠️ The former ASP.NET Core scope is **RETIRED** — see the banner below

**Status:** Planned — full-scoped serial Epic 24 (15 stories, first-to-completion; absorbed release-safety scope); branch `epic-24-nestjs-shell-migration` created (no commits yet); full BR+IMP docs authored for 24-1/24-2/24-3/24-4/24-7, stories 24-5/24-6/24-8…24-15 stubbed in the epic IMP README — status stays `planned` until 24-1 ships

**Last Update:** August 21, 2026

> **Story docs:** 24-1 ([BR](story-24-1-p0-1-security-stopgap.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md)), 24-2 ([BR](story-24-2-nest-shell-scaffold-proof.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-2-nest-shell-scaffold-proof.md)), 24-3 ([BR](story-24-3-http-layer-parity.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-3-http-layer-parity.md)), 24-4 ([BR](story-24-4-shared-module-async-providers.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-4-shared-module-async-providers.md)) and 24-7 ([BR](story-24-7-guest-identity-calibration.md) · [IMP](../../issue-implementation/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md)) are fully authored. 24-5/24-6/24-8…24-15 exist as title+goal+AC stubs in the epic [IMP README](../../issue-implementation/epic-24-nestjs-shell-migration/README.md); their full docs are authored at the point each runs.

## Scope (D7 shell-swap)

_See the ratified epic plan (`docs/planning/epics-25-40.md` — D7 row + OI-1 decision record + D9 serial re-ratification) and tech-mapping D1/D7._

- Migrate the backend onto a NestJS 11 shell (mechanical shell-swap) — **full-scoped serial: Epic 24 runs first to completion; epics 25–28 land on NestJS after (owner re-ratification 2026-08-21, D9)**
- Absorb the cross-cutting release-safety items within the epic: P0-1 stopgap (24-1) + structural fix (24-11), calibrated guest identity + minimal FE lockstep (24-7), additive `SrsCardState` schema/vector (24-11); quiz-FE fixes C-declared (26)
- Complete before epic-29; epics 29/30/31 land on NestJS
- Build the calibrated substrate (E.0–E.2 AI gateway, retrieval seam, tracking) as epics land
- Keep the existing content/features and tests; retrofit the substrate rather than rebuild from scratch

## User Stories

This epic consists of the following user stories (full 15-story serial breakdown per the Architect's serial re-scope; slugs match the story file names — 24-1/24-2/24-3/24-4/24-7 link to authored BRs, 24-5/24-6/24-8…24-15 are stubbed in the epic [IMP README](../../issue-implementation/epic-24-nestjs-shell-migration/README.md)):

1. **24-1 — P0-1 Security Stopgap** ([BR](story-24-1-p0-1-security-stopgap.md)) **_(NEW — absorbs epic-25 P0-1 stopgap half)_**
   - As an operations lead, I want the live cross-tenant SRS leak closed now on Express — `findByUserAndTypes`/`countDue` reject `undefined` userId structurally, `ReviewController` drops `req.userId!` (explicit 401), P0-1 regression test + T1 baseline recorded — so that no guest can read another user's rows while the migration runs.

2. **24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern** ([BR](story-24-2-nest-shell-scaffold-proof.md))
   - As an engineering lead, I want the backend bootstrapped on a dev-only NestJS 11 shell (Express adapter) with `words`/`phonetic-clusters`/`grammar`/`chengyu` ported and verified by a route-parity harness, so that the shell-swap pattern is proven risk-free before any production cutover.

3. **24-3 — HTTP-Layer Parity: `{code,message,requestId}` Envelope + RequestId + Rate-Limit** ([BR](story-24-3-http-layer-parity.md)) **_(absorbs A-items O1 + 2.12: error-visibility + body-parser parity)_**
   - As an engineering lead, I want the Nest shell contract-identical at the HTTP layer (error envelope, requestId, rate-limit, error-logging + body-parser limits), so that every later port inherits correct semantics.

4. **24-4 — SharedModule/DatabaseModule + Async Providers** ([BR](story-24-4-shared-module-async-providers.md)) **_(absorbs A-items R2 + 2.14 + 2.19: graceful shutdown + `GcsFileStore` as provider)_**
   - As a backend engineer, I want `config`/`PrismaClient`/`CacheService`/shared clients and services exposed as Nest providers (async, top-level-await-resolved) with graceful shutdown, so that cache/gemini/jwt-dependent modules can be ported.

5. **24-5 — Auth-Surface Guards (Calibrated)** _(stubbed — ports the F6-unified calibrated semantics, not current code)_ **_(absorbs epic-25 F6 unification)_**
   - As a backend engineer, I want `authenticateToken`/`optionalAuth`/`requireAuth` ported to Nest guards targeting the **calibrated** guest semantics (guest → session-local/empty, never all-unlocked), so that auth-protected routes are correct on Nest.

6. **24-6 — Auth Module Port** _(stubbed)_
   - As a user, I want the `auth` endpoints (register/login/refresh/logout/me) served by the Nest shell with calibrated guards and brute-force rate limiting, so that authentication is unchanged during migration.

7. **24-7 — Guest Identity Calibration** ([BR](story-24-7-guest-identity-calibration.md)) **_(NEW — absorbs epic-25 F1 + identity lockstep (FE-minimal))_**
   - As a product owner, I want `createGuestPhaseGate → {currentPhase:1, isGuest:true}` with types/tests + the minimal FE lockstep (AppLayout `:4 → isGuest`, `getGates` guest-branch unification) + guest e2e, so that guests unlock exactly Phase 1 and backend + shell agree before cutover.

8. **24-8 — Characters + Mnemonics Port** _(stubbed)_ **_(absorbs epic-25 F6 for mnemonics: calibrated `OptionalAuthGuard`, guest → empty)_**
   - As a user, I want the character and mnemonic endpoints served by the Nest shell (incl. calibrated `OptionalAuthGuard` + cache/gemini), so that reference + AI-generated content keeps working during migration.

9. **24-9 — Radicals + Foundations Port** _(stubbed — ports on current content; 27 re-touches data on Nest later)_
   - As a user, I want the radicals and foundations reference endpoints served by the Nest shell on the current content (no wait for epic-27), so that reference data keeps working.

10. **24-10 — Audio + Health Port** _(stubbed — calibrated `optionalAuth` + cache-first-free-for-guests verified in-port)_ **_(absorbs epic-25 F5 TTS surface)_**
    - As a user, I want the TTS and health endpoints served by the Nest shell with calibrated `optionalAuth`/audio behavior (cache-first-free for guests), so that audio generation keeps working.

11. **24-11 — Review Port + SRS Schema** _(stubbed — structural P0-1 fix + absorbed additive `SrsCardState` schema/enum + reserved pgvector; interval-doubling preserved)_ **_(absorbs epic-25 P0-1 structural + epic-28 SrsCardState additive)_**
    - As a user, I want review items/due-count/result served by the Nest shell with the P0-1-safe repository and the final SRS data shape, so that spaced-repetition data stays secure and correct.

12. **24-12 — Readers Port** _(stubbed — calibrated `optionalAuth` on passage-audio; 5/day DB-backed rate-limit)_ **_(absorbs epic-25 F5 passage-audio)_**
    - As a user, I want the readers endpoints (passages/generate/sessions/bookmarks) served by the Nest shell with the same DB-backed 5/day rate limit, so that graded readers keep working.

13. **24-13 — Quiz + Progression Port + Circular-DI Resolution** _(stubbed — backend engine ported correctly; progression guest branch unified to calibrated gate; FE quiz-engine fixes NOT absorbed, C-declared)_ **_(absorbs epic-26 M1 backend shape + epic-25 F6 progression)_**
    - As a user, I want the quiz and progression endpoints served by the Nest shell with the `progression ↔ quiz` cycle resolved via Nest DI (`forwardRef`) and the correct backend engine shape, so that practice and progression keep working.

14. **24-14 — Release-Safety Cutover Gate** _(stubbed — DoD checklist + pre-flight sign-off; serial-flipped: S1/S2 absorbed, quiz-FE bugs C-declared, schema absorbed-additive; post-flip smoke + rollback + watch window)_ **_(absorbs A-items P1/P2/T1/O1/O2/D1/D2/R1/DOC)_**
    - As an operator, I want a hard pre-flight gate that blocks cutover unless security/parity/tests/observability/deploy gates pass, so that the fully-migrated release is verifiably safe to flip.

15. **24-15 — Deployment Cutover + Retire Dual-Mode + Docs Refresh** _(stubbed — flip Railway, delete Express, openapi reconciliation, migration-safety pre-flight, `/api-docs`, rollback)_ **_(absorbs A-items 2.6/2.7/2.13/2.16/2.17/2.18)_**
    - As an operator, I want production to boot from the Nest entry with the Express surface removed and the API/docs contract refreshed, so that epics 25–28 land on NestJS.

## Acceptance Criteria

- [ ] Runs **first, to completion** (serial, 15 stories); absorbed release-safety items ship **within** the epic (P0-1 stopgap 24-1, guest identity 24-7, `SrsCardState` additive schema 24-11, release-safety gate 24-14); epics 25–28 land **on NestJS after** — owner re-ratification 2026-08-21 (D9).
- [ ] All **15 existing modules** under `apps/backend/src/modules/` are ported as Nest modules, each appearing exactly once across the port stories (24-2…24-13) — re-verify by listing the module directory when the epic closes.
- [ ] API contract preserved: the parity harness proves identical status **and body** on 2xx and identical status on 4xx/5xx for all ~63 routes across all 17 route files, versus the Express app.
- [ ] 4xx/5xx error envelope `{code, message, requestId}` + `X-Request-Id` header + rate-limit behavior + error-visibility (every 4xx/5xx logged with requestId/code/message) are contract-identical on the Nest shell (24-3).
- [ ] Nest shell is **dev-only** until the 24-15 cutover — Express remains the production entry (`node dist/app/index.js` via `railway.toml`/`Procfile`) through 24-14.
- [ ] The 25–28 collision zones (review, quiz, audio, progression, radicals, foundations, `authMiddleware`, `shared-constants`, Prisma schema) are touched **only within their absorbed stories** (24-1/24-5/24-7/24-8/24-10/24-11/24-13) — each absorbs its former epic's scope rather than colliding with an in-flight epic; `scripts/check-module-boundaries.mjs` stays green on every story.
- [ ] Cutover (24-15): Railway boots the Nest entry, `healthcheckPath` (`/api/v1/health`) green, Express controllers/routes/`req.xController`/`express.d.ts` augmentation removed, `openapi.yaml` regenerated truthfully vs `ROUTE_PATTERNS`, and architecture docs refreshed + truth-checked; rollback + post-flip smoke + watch window verified (24-14).
- [ ] Every story passes the canonical quality gates (`build`, `lint` 0 errors, `typecheck`, `test`, `test:full`, `test:integration`, `check:module-boundaries`).

## Architecture Decisions

- Decision: **D1 — NestJS 11** (ratified 2026-08-17, owner-approved)
  - Rationale: decisive for `@mandarin/srs-core` FE+BE bit-identical parity via the shared TS kernel (epic-34); mechanical shell migration; keeps Zod + `shared-types`; rejects the retired ASP.NET Core 8 scope.
  - Alternatives considered: ASP.NET Core 8 (retired), remaining on Express (no substrate for epics 29+).
  - Implications: all modulith + SSE/gateway/quota/DI concerns land on NestJS; the shell must be proven before epics 29/30/31.

- Decision: **D7 — shell-swap (not greenfield, not full migrate), re-ratified serial 2026-08-21 (D9)** (ratified)
  - Rationale: mechanical shell migration; under the owner's serial re-ratification Epic 24 runs **first to completion** (15 stories), then epics 25–28 land on NestJS — the "parallel with 25–28" clause is superseded. Keep the existing content/features/tests; retrofit the calibrated substrate rather than rebuild.
  - Alternatives considered: big-bang rewrite (rejected — collision + risk), deferring until after 29 (rejected — 29/30/31 need the shell), parallel-with-25–28 (superseded — no parallel capacity, owner 2026-08-21, D9).
  - Implications: 15-story breakdown; serial order 24-1→24-15; absorbed release-safety scope (P0-1, guest identity, SrsCardState additive) rides the port stories.

- Decision: **Dev-only dual-mode until cutover**
  - Rationale: Nest shell is proof-only and never production until 24-15; this is the load-bearing decision that keeps the migration zero-risk (Express stays production through 24-14).
  - Alternatives considered: flipping modules to production as ported (rejected — double cutover risk).
  - Implications: two controller surfaces per ported module are temporary; Express controllers are deleted at cutover.

- Decision: **Retain `express-rate-limit`, do not adopt `@nestjs/throttler`**
  - Rationale: exact-parity risk; `express-rate-limit` is already a dependency (`^8.5.2`) and can be mounted via `app.use` on the Nest Express adapter with identical configs (trust-proxy real-IP).
  - Alternatives considered: `@nestjs/throttler` (rewrite + parity drift — rejected).
  - Implications: decision recorded in story 24-3 IMP; per-route limits for not-yet-ported auth/readers are declared as infra in 24-3 and applied in 24-6/24-12.

- Decision: **`forwardRef` primary for the `progression ↔ quiz` cycle**
  - Rationale: idiomatic Nest for circular DI and removes the mutable `setQuizService` setter; only both sides being Nest modules in the same graph makes `forwardRef` honest.
  - Alternatives considered: preserving re-injection (port `setQuizService` as a provider factory step) — documented fallback if `forwardRef` hits lazy-init issues.
  - Implications: parity harness is the arbiter; ADR recorded in 24-13.

- Decision: **Keep plain `tsc`, no `nest-cli.json` until cutover**
  - Rationale: the production contract `start = node dist/app/index.js` is non-negotiable; `nest build` only wraps `tsc` and adopting it now changes the pipeline for zero benefit. The Nest shell compiles to `dist/nest/main.js` as a side artifact of the same `tsc` pass.
  - Alternatives considered: `nest build`/`nest-cli.json` at 24-2 (rejected — cutover-time decision, 24-15).
  - Implications: `predev`/`prebuild`/`build`/`railway.toml`/`Procfile` stay untouched through the port stories.

- Decision: **Node 24 LTS reconciliation in the 24-2 commit**
  - Rationale: Node 20 is EOL (Mar 2026); tech-mapping C1 pins 24 LTS; `@types/node` is already `^24.7.2`; NestJS 11 targets modern Node.
  - Alternatives considered: deferring the bump (rejected — cross-cutting change is cheapest in the scaffolding commit).
  - Implications: `engines` → `>=22`, `.node-version`/`.nvmrc` → 24.x; owner tick-off required (open item 2).

- Decision: **P0-1 stopgap first (24-1, before the shell)** — ADR-24-A
  - Rationale: under serial there is no epic-25 to front-load; the confirmed live cross-tenant leak (`ReviewRepository.findByUserAndTypes`/`countDue` ignore `undefined` userId → every user's rows; `ReviewController` uses `req.userId!`) must be closed **now** on Express — the only ordering that keeps the exposure window to days, not the ~5-week epic. Ships independently, does not wait for the shell.
  - Alternatives considered: folding the stopgap into the review port (24-11) (rejected — leak stays open the whole epic); waiting for the Nest shell (rejected — same).
  - Implications: 24-1 closes the leak on Express; the structural fix is re-authored as defense-in-depth in 24-11 and enforced by 24-14.

- Decision: **Calibrated auth semantics as the port target (not current code)** — ADR-24-B
  - Rationale: 24-5 ports the three auth guards to the **calibrated** unified guest semantics (F6: guest → session-local/empty, never all-unlocked), using the calibration spec as the source of truth rather than the current inconsistent `optionalAuth` shape — the single-touch win of the absorption (no "port pre-25 then rework").
  - Alternatives considered: porting the current pre-calibration shape then reworking on Nest (rejected — double touch).
  - Implications: 24-5/24-6/24-8/24-10/24-13 copy the settled calibrated shape; 24-7 lands the identity lockstep first.

- Decision: **`SrsCardState` additive schema absorption into the review port (24-11)** — ADR-24-C
  - Rationale: Epic 24 is the migration epic and owns `db:migrate:deploy`; running the **additive-only** `ReviewItem → SrsCardState` 4-state schema + enum + reserved pgvector here ships the final SRS data shape with the migration (no post-release schema migration on the P0-1-anchor repo). Interval-doubling semantics preserved (no FSRS change — that's 34); destructive cleanup + CharacterMastery/LearnerState stay in 28.
  - Alternatives considered: shipping pre-28 schema and letting 28 migrate on Nest post-release (rejected — worst double-touch on the most sensitive surface).
  - Implications: 24-11 re-points review to `SrsCardState`; additive-only satisfies the D1 gate; destructive drops deferred.

- Decision: **Quiz-engine FE fixes NOT absorbed (C-declared to 26)** — ADR-24-D
  - Rationale: the M1 quiz fixes (`PHASE_CONFIGS[3]`, key-4 dup, `useQuizCard` aggregation, `QuizCard` label) are ~95% frontend (registries/hooks/components) — a backend migration epic pulling them in would be wrong-call scope creep and needs a UI design pass. They are **live today** and parity is backend-to-backend, so they ship as known-post-release, tracked in 26.
  - Alternatives considered: absorbing the FE quiz fixes (rejected — FE feature story, not migration scope).
  - Implications: 24-13 ports the **correct** backend engine shape (no backend bug canonized); 24-14 release checklist explicitly declares the quiz-FE bugs as C (tracked in 26).

- Decision: **Serial re-ratification (D9)** — Epic 24 runs first to completion; 25–28 after, on NestJS (ratified 2026-08-21, decision-log D9)
  - Rationale: no capacity for parallel tracks; full-scoped Epic 24 is self-contained and fronts the roadmap; every former B-gate (P0-1, guest-auth, quiz-FE, SRS schema) becomes A (absorb) or C (declare) — no prerequisite epic running beside 24.
  - Alternatives considered: parallel-with-25–28 (superseded — owner 2026-08-21), hybrid front-load (rejected under serial).
  - Implications: roadmap stall risk (R1) + single-point-of-failure (R2) accepted; timeline ≈5 weeks (4–7); epics 25–40 queue behind the migration.

## Implementation Plan

1. **24-1** P0-1 security stopgap — close the live cross-tenant SRS leak on Express (`findByUserAndTypes`/`countDue` reject `undefined` userId, drop `req.userId!`, P0-1 regression test, T1 baseline recorded) — **ships independently, FIRST**.
2. **24-2** NestJS 11 shell scaffold + reference-module proof (`words`/`phonetic-clusters`/`grammar`/`chengyu`) + parity harness + Node 24 — **T1 baseline hard precondition recorded before starting**.
3. **24-3** HTTP-layer parity: error envelope + requestId + rate-limit + **error-visibility + body-parser parity** — sits on 24-2.
4. **24-4** `SharedModule`/`DatabaseModule` + async providers + **graceful shutdown + `GcsFileStore` lazy-singleton** — sits on 24-3.
5. **24-5** Auth-surface guards **ported to the calibrated semantics (F6)** — the calibration spec is the source of truth, not current code (absorbs epic-25 F6).
6. **24-6** Auth module port + guards applied — 5 endpoints, brute-force rate-limit; `/me` returns the calibrated guest identity.
7. **24-7** Guest identity calibration — `createGuestPhaseGate → {currentPhase:1, isGuest:true}` + types/tests + minimal FE lockstep (AppLayout `:4 → isGuest`, `getGates` guest branch) + guest e2e (absorbs epic-25 F1).
8. **24-8** Characters + mnemonics port — 7+4 routes; mnemonics uses the calibrated `OptionalAuthGuard` (guest → empty) (absorbs epic-25 F6 mnemonics).
9. **24-9** Radicals + foundations port — 4+4 routes on **current** content; no wait for 27 (27 re-touches data on Nest later).
10. **24-10** Audio + health port — calibrated `optionalAuth` + cache-first-free-for-guests verified in-port (absorbs epic-25 F5 TTS).
11. **24-11** Review port + SRS schema — structural P0-1 fix (Nest repo rejects `undefined` userId) + **absorbed additive `SrsCardState` schema/enum + reserved pgvector**; interval-doubling preserved; calibrated `requireAuth` (absorbs epic-25 P0-1 structural + epic-28 schema).
12. **24-12** Readers port — 11 routes; calibrated `optionalAuth` on passage-audio; 5/day DB-backed rate-limit (absorbs epic-25 F5 passage-audio).
13. **24-13** Quiz + progression port + circular-DI resolution — `forwardRef` primary; backend engine ported **correctly** (no backend bug canonized); progression guest branch unified to the calibrated gate; calibrated `optionalAuth` on guest quiz submit; **FE quiz-engine fixes NOT absorbed (C)** (absorbs epic-26 M1 backend shape + epic-25 F6 progression).
14. **24-14** Release-safety cutover gate — DoD checklist + pre-flight sign-off (serial-flipped: S1/S2 absorbed, quiz-FE bugs C-declared, schema absorbed-additive); post-flip smoke + rollback + watch window.
15. **24-15** Deployment cutover + retire dual-mode + docs refresh — flip Railway, delete Express, `openapi.yaml` reconciliation, migration-safety pre-flight (additive-only), `/api-docs`, rollback.

**Gating summary (serial):** no external gates — the epic runs 24-1 → 24-2 → … → 24-15 in order (single engineer). Absorbed-scope stories (24-1/24-5/24-7/24-8/24-10/24-11/24-13) carry their former epic's work **inside** the epic instead of gating on it. Timeline ≈5 weeks (4–7). 24-14 is the hard pre-flight immediately before 24-15's flip.

**Shared-track discipline across all stories:** `apps/backend/package.json` + `package-lock.json` (Nest deps by 24 — single-version guard `npm ls express`, one PR at a time), `apps/backend/tsconfig.json` (decorator flags by 24-2), `scripts/check-module-boundaries.mjs` (green every story). Collision zones are touched **only within their absorbed stories**: review (24-1/24-11), quiz (24-13), audio (24-10), progression (24-13), radicals/foundations (24-9), `authMiddleware` (24-5), `shared-constants` (24-7), Prisma schema (24-11).

## Risks & mitigations

- Risk: Dev-only dual-mode not confirmed (Nest shell leaks into production early) — Severity: **High**
  - Mitigation: owner confirms Nest is proof-only until 24-15; Express entry (`dist/app/index.js`) + `railway.toml`/`Procfile`/`start` untouched through 24-14.
  - Rollback: Express entry is never removed until cutover, so production can always fall back to it.

- Risk: Node 24 reconciliation (engines/`.node-version`/`.nvmrc` bump) — Severity: **Low**
  - Mitigation: owner tick-off that the 24 LTS bump lives in the 24-2 scaffolding commit; `@types/node` already `^24.7.2`; epics 25–28 land after and don't pin Node 20.
  - Rollback: revert the three files in the 24-2 commit.

- Risk: Test baseline (full + integration) not actually green before 24-1 — Severity: **Medium**
  - Mitigation: 24-1 runs `npm run test:full` + `npm run test:integration` first and records + triages the real pass/fail in a verification artifact (the 2026-08-21 "green" claim is unverified) — the epic-level T1 hard precondition.
  - Rollback: n/a — baseline recorded, not changed.

- Risk: radicals/foundations ported before epic-27 M1 (double-touch) — Severity: **Low**
  - Mitigation: 24-9 ports on **current** content; epic-27 (landing after, on NestJS) re-touches the data — the port does not wait for 27-M1.
  - Rollback: n/a — 24-9 is deliberately current-content.

- Risk: Rate-limit parity approach (retain `express-rate-limit` vs `@nestjs/throttler`) — Severity: **Medium**
  - Mitigation: retain `express-rate-limit` (recommended, exact parity, already a dep `^8.5.2`) mounted via `app.use`; decision recorded in 24-3 IMP.
  - Rollback: swap back to the identical Express configs — the harness verifies 429 status parity.

- Risk: Circular-DI pattern for `progression ↔ quiz` (`forwardRef` vs re-injection) — Severity: **High**
  - Mitigation: `forwardRef` primary, re-injection (`setQuizService` port) as documented fallback; parity harness is the arbiter; ADR recorded in 24-13.
  - Rollback: fall back to the re-injection provider factory if `forwardRef` hits lazy-init issues.

- Risk: Final production entry path + build tooling at cutover (`dist/nest/main.js` vs relocated `dist/app/main.js`; `nest build`) — Severity: **Medium**
  - Mitigation: confirm at 24-15; recommend keep plain `tsc` + side-artifact compile unless a reason emerges.
  - Rollback: Express `start` command restored until the flip is green.

- Risk: `openapi.yaml` is stale (missing `/vocabulary`/`/progress`, incomplete vs ~63 routes) — Severity: **Medium**
  - Mitigation: regenerate/reconcile at 24-15 from a confirmed source (openapi ↔ `ROUTE_PATTERNS` ↔ Nest registry diff); `ROUTE_PATTERNS` + a refreshed spec become the single source of truth.
  - Rollback: n/a — docs-only.

- Risk: Express retirement shape (full deletion vs `start:express` escape hatch) — Severity: **Medium**
  - Mitigation: recommend delete outright (controllers/routes/`req.xController`/`express.d.ts` augmentation); the cutover parity gate (24-14) de-risks the flip; decision recorded at 24-15.
  - Rollback: keep `start:express` for one release if owner prefers (decision recorded).

- Risk: Absorbed 25–28 surfaces ported against an unsettled shape — Severity: **Medium**
  - Mitigation: under serial there is no in-flight epic-25; 24-5/24-7/24-8/24-10/24-13 port the **calibrated** semantics directly (24-5's AC pins the calibration spec as the port source-of-truth; 24-7 lands the identity lockstep first) — no "copy unsettled surface then rework".
  - Rollback: n/a — the calibrated shape is the port target by decision (ADR-24-B).

- Risk: Shared-track PR discipline (merge conflicts on `package.json`/`package-lock.json`/`tsconfig.json`) — Severity: **High**
  - Mitigation: single-PR-at-a-time rule; merge via `npm install`; enforce the `npm ls express` single-version guard; `tsconfig.json` decorator flags by 24-2 (epics 25–28 land after and won't touch).
  - Rollback: revert the conflicting dep change and re-merge.

- Risk: Absorbed `SrsCardState` schema migration runs on the most sensitive table — Severity: **Med-High**
  - Mitigation: design the 24-11 migration **additive-only** (new table/enum/vector, keep `ReviewItem` until 34/28); pre-flight migration review at 24-15; interval-doubling preserved (no FSRS semantics change); P0-1 fix + schema re-point land in the same repo (24-11).
  - Rollback: additive migration is reversible (no destructive drop at cutover); Express `start` escape hatch until green.

- Risk: **R1 — Roadmap stall** (the entire AI critical path 25→33 + data/HSK work 27 queue behind a ~5-week full-scoped Epic 24; zero user-visible value in that window) — Severity: **High**
  - Mitigation: accept (owner decision); 24-1 lands as an early security win; scope tightly bounded so it doesn't balloon past ~7wks; if a second track ever opens, 27's framework-neutral data work is the best candidate to decouple.
  - Rollback: n/a — owner-accepted sequencing cost.

- Risk: **R2 — Single-point-of-failure** (the migration is now the front of the whole roadmap; a stall stalls everything) — Severity: **High**
  - Mitigation: 24-2/24-3/24-4 prove the pattern fast (runway unchanged); shell stays dev-only through 24-14; the release-safety gate (24-14) makes the "safe to flip" decision visible.
  - Rollback: n/a — the gate is the visibility lever.

- Risk: **R3 — Parity canonizing pre-26 quiz FE bugs (C)** — Severity: **Low-Med**
  - Mitigation: the harness compares Nest↔Express backend only, so FE config bugs aren't canonized; the release checklist (24-14) explicitly **declares** the quiz-FE bugs as C (tracked in 26) — never silently shipped as fixed.
  - Rollback: n/a — declared, not fixed, in 24.

- Risk: **R4 — Schema migration risk (absorbed-additive)** — Severity: **Med-High**
  - Mitigation: additive-only `SrsCardState` migration (new table/enum/vector, keep `ReviewItem` until 34/28); pre-flight migration review at 24-15; interval-doubling preserved (no FSRS semantics); P0-1 fix + schema re-point land in the same repo (24-11).
  - Rollback: additive migration is reversible; Express escape hatch until green.

- Risk: **R5 — FE lockstep coupling** (`createGuestPhaseGate → currentPhase:1` without the FE AppLayout/`getGates` lockstep breaks guests at cutover) — Severity: **Med**
  - Mitigation: 24-7 absorbs the minimal FE lockstep + a guest e2e asserting the Phase-1 shape; the release gate checks guest behavior (S2).
  - Rollback: n/a — lockstep ships in-epic.

- Risk: **R6 — Auth-surface double-touch** (avoided only if guards are ported to the calibrated shape in 24-5, not the current pre-25 shape) — Severity: **Med**
  - Mitigation: 24-5's AC pins the calibration spec as the port source-of-truth (ADR-24-B); no "port pre-25 then rework".
  - Rollback: n/a — calibrated shape is the port target by decision.

## Implementation notes

- Conventions: follow `docs/guides/conventions/backend.md` and `docs/knowledge-base/practices/solid-principles.md`; the factory→`@Module` mapping is documented in `docs/knowledge-base/backend/module-level-containers.md`.
- See the epic [IMP README](../../issue-implementation/epic-24-nestjs-shell-migration/README.md) for per-story technical ACs and the 24-5/24-6/24-8…24-15 stubs.

---

## ⚠️ RETIRED — ASP.NET Core 8 migration (historical appendix, preserved for traceability)

> **RETIRED 2026-08-17** — The ASP.NET Core 8 migration below is **retired**. Its revalidation gate is unmet and **D1 (NestJS 11, owner-approved 2026-08-17) rejects .NET**. The active scope is the D7 NestJS shell-swap above. This material is preserved for traceability only; do not build from it.

### Epic 24 (historical): .NET Backend Migration (Parked)

## Epic Summary

**Goal:** [PARKED — SEE REVALIDATION GATE] Migrate all backend services from Node.js to ASP.NET Core 8, establishing a production-grade .NET architecture for long-term maintainability and performance.

**Key Points:**

- Build ASP.NET Core 8 project with clean architecture mirroring Epic 13 Node.js structure
- Migrate Progress Service first (deepest learning opportunity, heaviest business logic)
- Migrate TTS Service (Google Cloud TTS SDK in C#), Conversation Service (Gemini integration), and Auth Service progressively
- Use gradual rollout strategy (service-by-service cutover with traffic routing and rollback safety)
- Sunset Node.js backend completely after all services migrated and stabilized in production
- ⚠️ PARKED: Requires revalidation before resuming (see Revalidation Gate below)

**Status:** Parked

**Last Update:** June 14, 2026

## Revalidation Gate

This epic is parked indefinitely. Before resuming, at least 2 of the following triggers must be met:

- [ ] Node.js backend shows measurable CPU bottlenecks (>80% CPU sustained, >500ms p95 latency)
- [ ] A customer contract explicitly requires .NET backend
- [ ] Team has dedicated capacity for 8+ weeks with no higher-priority learning content to build
- [ ] Performance regression in existing Node.js services cannot be resolved without full rewrite

If fewer than 2 triggers are met, keep parked and re-evaluate quarterly.

## User Stories

## Acceptance Criteria

## Architecture Decisions

## Implementation Plan

## Risks & mitigations

## Implementation notes
