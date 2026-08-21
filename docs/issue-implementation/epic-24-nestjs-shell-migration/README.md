---
purpose: "Epic 24 implementation — full-scoped serial NestJS 11 shell-swap (D7), runs first; 25–28 after on NestJS"
status: in-progress
last-verified: 2026-08-21
type: epic
---

# Epic 24: NestJS Shell Migration — Implementation

**BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/README.md`

**Status:** In progress — full-scoped serial Epic 24 (15 stories, first-to-completion; absorbed release-safety scope); branch `epic-24-nestjs-shell-migration`; **24-1 shipped** (P0-1 stopgap — live Express leak closed, T1 baseline recorded); full story docs authored for 24-1/24-2/24-3/24-4/24-5/24-6/24-7, 24-8…24-15 stubbed below — status stays `in-progress` until all 15 stories ship

**Last Update:** August 21, 2026

---

## Scope (D7 shell-swap)

_See the ratified epic plan (`docs/planning/epics-25-40.md` — D7 row + OI-1 decision record + D10 serial re-ratification) and tech-mapping D1/D7._

- Migrate the backend onto a NestJS 11 shell (mechanical shell-swap) — **D1 = NestJS 11, owner-approved 2026-08-17**
- **Full-scoped serial: Epic 24 runs first to completion (15 stories); epics 25–28 land on NestJS after — owner re-ratification 2026-08-21 (D10)**
- Absorb the cross-cutting release-safety items within the epic: P0-1 stopgap (24-1) + structural fix (24-11), calibrated guest identity + minimal FE lockstep (24-7), additive `SrsCardState` schema/vector (24-11); quiz-FE fixes C-declared (26)
- Build the calibrated substrate (E.0–E.2 AI gateway, retrieval seam, tracking) as epics land on the shell
- Keep the existing content/features/tests; retrofit the substrate — not a greenfield rebuild

## User Stories

15 stories covering all **15 existing modules** + the HTTP/DI/deploy substrate + the absorbed release-safety scope (P0-1 stopgap, calibrated guest identity, `SrsCardState` additive schema). Every module is accounted for exactly once in a port story. 24-1/24-2/24-3/24-4/24-5/24-6/24-7 are fully authored; 24-8…24-15 are stubs (title + goal + ACs) authored as full BR/IMP docs at the point each runs.

### 24-1 — P0-1 Security Stopgap **_(NEW — absorbs epic-25 P0-1 stopgap half)_**

**Goal:** Close the live cross-tenant SRS leak on Express now — `findByUserAndTypes`/`countDue` reject `undefined` userId structurally (no Prisma ignore-`undefined` path), `ReviewController` drops `req.userId!` (explicit 401), P0-1 regression test, T1 baseline recorded + triaged. Ships independently; does not wait for the Nest shell.

**ACs:** Repo rejects `userId === undefined` before Prisma on `findByUserAndTypes`/`countDue`; `ReviewController` returns explicit 401 (no `req.userId!`); P0-1 regression test green (guest ⇒ 401/empty, never another user's rows); T1 baseline (full + integration) recorded + triaged in a verification artifact before work; no other review/schema/FE changes; all gates green.

**Status:** ✅ completed — shipped independently on Express (leak closed, 10 P0-1 regression tests, T1 baseline + post-change verification in `../../../verification-artifacts/test-report-24-1.md`). **Commit hash:** _(to be filled at epic close)_.

**Gate:** none — **first story, ships independently**. **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md) · [IMP](story-24-1-p0-1-security-stopgap.md) (full).

### 24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern

**Goal:** Bootstrap a dev-only Nest 11 shell (Express adapter) and port `words`/`phonetic-clusters`/`grammar`/`chengyu` with a route-parity harness — proving the swap pattern risk-free.

**ACs:** Nest 11 deps + decorator flags + `src/nest/main.ts`/`app.module.ts` boot with identical CORS/`trust proxy 1`/cookie/`/api` prefix; Express prod path + `railway.toml`/`Procfile`/`start` untouched; 4 modules ported under `modules/<name>/nest/` (exact success JSON + status, 4xx status; envelope deferred to 24-3); **test baseline = epic-level hard precondition (record + triage before starting)**; parity harness covers **`WordsRoutes.ts` (uppercase)** + the other 3 route files under `vitest.integration.config.ts` with skip-guard on missing `DATABASE_URL`; Node reconciled to 24 LTS + single `npm ls express` + `check:module-boundaries` green; no `SharedModule`, no 25–28 zone touched; all gates green.

**Status:** ✅ completed — Nest 11 dev-only shell scaffolded (Express adapter) with the shared `configure-app.ts` boot shape; `words`/`phonetic-clusters`/`grammar`/`chengyu` ported under `modules/<name>/nest/` reusing services/repos (useFactory + `@Inject`); 23-assertion route-parity harness green (`tests/integration/nest/route-parity.test.ts`, skip-guard on missing `DATABASE_URL`); Express prod path untouched (`dist/app/index.js` still emitted). **Commit hash:** _(to be filled at epic close)_.

**Gate:** none — sits on 24-1. **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-2-nest-shell-scaffold-proof.md) · [IMP](story-24-2-nest-shell-scaffold-proof.md) (full).

### 24-3 — HTTP-Layer Parity: `{code,message,requestId}` Envelope + RequestId + Rate-Limit

**Goal:** Make the Nest shell contract-identical at the HTTP layer (error filter, requestId interceptor, rate-limit middleware) + error-visibility + body-parser parity so every later port inherits correct semantics.

**ACs:** 4xx/5xx deep-equal to Express for status + `{code, message, requestId}` shape; `X-Request-Id` set + echoed into envelope; rate-limit honors same per-route configs + real-IP via `trust proxy` (429 status parity; auth limits applied later in 24-6/24-12); **error-visibility parity — filter logs every 4xx/5xx with requestId/code/message identically to `errorHandler.ts`**; **body-parser parity — json + urlencoded limits reproduced**; harness extended + green, no 25–28 zone file touched; `@nestjs/throttler` decision recorded (recommend reject — retain `express-rate-limit`).

**Status:** ✅ completed — HTTP-layer parity shipped on the Nest shell: global `AppExceptionFilter` (`{code, message, requestId}` envelope via pure `resolveHttpError()`/`logError()`) + `mountExpressErrorBridge()` (mounted last — Nest filters can't see pre-router `app.use` errors, enabling body-parser 413 parity); `request-id.middleware.ts` re-exports the shared `requestIdMiddleware` (zero drift); `express-rate-limit` retained — `@nestjs/throttler` rejected (decision recorded), `words` applied path-scoped, auth/readers declared as infra; body-parser via `bodyParser: false` + explicit `express.json()`/`urlencoded({ extended: true })`; route-parity harness extended 23→30 (413 envelope deep-equal, `X-Request-Id`, seeded 429 + 500, log-parity). **Commit hash:** _(to be filled at epic close)_.

**Gate:** none (sits on 24-2). **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-3-http-layer-parity.md) · [IMP](story-24-3-http-layer-parity.md) (full).

### 24-4 — SharedModule/DatabaseModule + Async Providers

**Goal:** Expose `config`/`PrismaClient`/`CacheService` (async, top-level-await) + shared clients/services as Nest providers — the DI substrate for cache/gemini/jwt modules.

**ACs:** `SharedModule`/`DatabaseModule` compile + boot; `CacheService` resolves via async provider before first request; no new `shared/`→`modules/` edge (`check:module-boundaries` green) + Express `app/container.ts` untouched; providers unit-tested (Prisma singleton, cache async resolution, lazy external clients); **graceful shutdown — `onApplicationShutdown` (`PrismaClient.$disconnect()`, `redisClient.quit()`, cache teardown) + shutdown unit test**; **`GcsFileStore`/external clients as lazy-singleton providers (no top-level `new GCSClient()` in Nest land)**; no 25–28 collision-zone file touched.

**Status:** ✅ completed — `SharedModule`/`DatabaseModule` expose the shared infra as Nest providers: `CacheService` async `useFactory` (resolves the Express top-level await before first request), `PrismaClient` via the Prisma 7 CJS + `PrismaPg` connection-string factory, the three config homes (`CONFIG`/`GATE_THRESHOLDS`/`AUDIO_CONFIG`) + `CONTENT_UTILS` + `WordRepository`/`JwtService`/`PasswordService` + external clients (`GeminiClient`/`GCSClient`/`GoogleTTSClient`/`GeminiService`/`GcsFileStore`) as lazy singletons; graceful shutdown (`$disconnect()`/`redisClient.quit()`); `GcsFileStore` DI fix (constructor-injected GCS client, lazy fallback); provider + shutdown unit tests; boundaries green. **Commit hash:** _(to be filled at epic close)_.

**Gate:** none (sits on 24-3). **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-4-shared-module-async-providers.md) · [IMP](story-24-4-shared-module-async-providers.md) (full).

### 24-5 — Auth-Surface Guards (Calibrated)

**_(completed — absorbs epic-25 F6 unification)_**

**Goal:** Port `authenticateToken`/`optionalAuth`/`requireAuth` to Nest guards targeting the **calibrated** unified guest semantics (F6: guest → session-local/empty, never all-unlocked) — the calibration spec is the source of truth, not current code.

**ACs:** Three guard types exist and reproduce the calibrated semantics (401 messages, guest handling, `req.userId`); parity harness proves 401/403 + guest-vs-user responses identical to Express on a test-protected route (with the calibrated guest shape per the calibration spec, F6); guard unit tests cover success/failure/guest/expired-token paths; no "port pre-25 then rework" — the calibrated shape is the port target (ADR-24-B).

**Status:** ✅ completed — `AuthGuard`/`OptionalAuthGuard`/`RequireAuthGuard` shipped under `src/nest/guards/` with the shared helpers (`resolveAccessToken` header→cookie fallback, `attachAuthUser` → `req.user`/`req.userId`, `AUTH_GUARD_ERRORS` matching `authMiddleware.ts` byte-for-byte, `ACCESS_TOKEN_COOKIE`), wired into `app.module.ts` via the `GuardsModule` providers module (not global — public routes unaffected); hermetic parity harness (`tests/integration/nest/auth-guards-parity.test.ts`) proves 401/403 + guest-vs-user identical to the real Express middleware; guard unit tests cover success/failure/guest/expired-token paths; additive `JwtService.verifyAccessToken` (+ tests); no code dependency on 24-7; no `packages/shared-constants` / 25–28 zone file touched. **Commit hash:** _(to be filled at epic close)_.

**Gate:** 24-4 (shared substrate) + the calibration spec (`wip/guest-access-calibration.md`) — **no code dependency on 24-7** (the guards read the spec, never `createGuestPhaseGate`). **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-5-auth-guards-calibrated.md) · [IMP](story-24-5-auth-guards-calibrated.md) (full).

### 24-6 — Auth Module Port

**Goal:** Port the `auth` module (register/login/refresh/logout/me — 5 endpoints) to Nest, wired with the 24-5 guards and brute-force rate-limit parity.

**ACs:** All 5 auth endpoints ported (register/login/refresh/logout public; `me` → `AuthGuard`); parity harness green (`tests/integration/nest/auth-parity.test.ts` — status + body, error envelope on 401/409, 429 brute-force); refresh-token rotation + httpOnly cookie semantics preserved (integration test); brute-force rate-limit matches Express (429 + `{error, code, message}` shape).

**Status:** ✅ completed — `AuthModule` = 1:1 of `createAuthModule(deps)` (useFactory providers injecting `AuthRepository`+`JwtService`+`PasswordService`; imports `SharedModule`+`GuardsModule`; exports `AuthService`); `AuthNestController` mirrors `AuthController.ts` 1:1 reusing `AuthService` unchanged, routes verbatim; `/me` → `@UseGuards(AuthGuard)`, register/login/refresh/logout public; one shared `authLimiter` (5/min/IP) on register+login mirroring `authRoutes.ts` (429 body deep-equal — no envelope); cookie parity (`setRefreshTokenCookie`/`clearRefreshTokenCookie` byte-for-byte, `@Res({passthrough:true})`); rotation proven in harness (reuse R1 → 401 `INVALID_TOKEN`); DB-gated parity harness boots real Express + Nest (+17 integration tests, 17/142; test:full 58/631). **Commit hash:** _(to be filled at epic close)_.

**Gate:** 24-4 + 24-5. **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-6-auth-module-port.md) · [IMP](story-24-6-auth-module-port.md) (full).

### 24-7 — Guest Identity Calibration **_(NEW — absorbs epic-25 F1 + identity lockstep (FE-minimal))_**

**Goal:** Change `createGuestPhaseGate → {currentPhase:1, isGuest:true}` in `packages/shared-constants/src/index.js` (+ `.d.ts` + tests) with the minimal FE lockstep (AppLayout `:4 → isGuest` removal, `getGates` guest-branch unification) + guest e2e.

**ACs:** `createGuestPhaseGate` returns `{currentPhase: 1, isGuest: true}` (no all-unlock; `id: "guest-unlocked"` + `phase4Unlocked: false` kept); `.d.ts` matches; new `shared-constants` test suite (5); `PhaseGate.isGuest?` additive; `AppLayout` removes the unauthenticated `: 4` override (single-source `effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1)`); `usePhaseGate` re-fetches on auth change + `phaseGateService` auth-keyed cache key — the FE consumes `fetchPhaseGate` (no FE `getGates` consumer), and the backend `/gates` GUEST branch is left for 24-13; guest e2e asserts the Phase-1 shape end-to-end; no full FE guest-shell UI (badge/banner, route-gate fallback, design spec — stays in 25).

**Status:** ✅ completed — `createGuestPhaseGate` calibrated to `{currentPhase:1, isGuest:true}` (sentinels kept; `PhaseGate.isGuest?` additive); minimal FE lockstep (AppLayout `:4` removed → single-source `effectivePhase`, `usePhaseGate` re-fetch on auth change, `phaseGateService` auth-keyed cache key); new shared-constants Vitest suite (5/5) + `AppLayout.guest.integration.test.tsx` (MSW serves the real `createGuestPhaseGate`); 5 comment-hygiene files; the FE consumes `fetchPhaseGate` (no FE `getGates` consumer) and the backend `/gates` GUEST branch is left for 24-13. **Commit hash:** _(to be filled at epic close)_.

**Gate:** 24-6 → 24-7 → 24-8 (serial); sets the calibrated identity shape for **24-13 (progression)** + the FE shell (the auth guards in 24-5 consume the calibration spec, not this shape). **Docs:** [BR](../../business-requirements/epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md) · [IMP](story-24-7-guest-identity-calibration.md) (full).

### 24-8 — Characters + Mnemonics Port

**_(STUB — absorbs epic-25 F6 for mnemonics)_**

**Goal:** Port `characters` (2 controllers — `CharactersController` + `PinyinController`; 7 routes: `:glyph`, `:glyph/phonetic`, `:glyph/homophones`, `:glyph/decomposition`, `/search`, `/frequency` + `GET /v1/pinyin/search`) and `mnemonics` (4 routes: GET/POST/PUT/DELETE on `/v1/mnemonics/:character`, cache+gemini, `optionalAuth`).

**ACs:** All 7 characters + 4 mnemonics routes ported; parity harness green (2xx body+status, 4xx envelope); mnemonics uses `SharedModule` cache+gemini + the **calibrated** `OptionalAuthGuard` (guest → empty, per F6); mnemonics POST/PUT/DELETE success + validation 4xx match Express; no other zone touched.

**Gate:** 24-3 + 24-4 + 24-5 (calibrated `OptionalAuthGuard`). **Docs:** stub — full BR/IMP authored when 24-8 runs.

### 24-9 — Radicals + Foundations Port

**_(STUB — current content; 27 stays C)_**

**Goal:** Port `radicals` (4 routes: `/radicals`, `/:id`, `/character/:glyph`, `/:id/characters`) and `foundations` (4 routes: `data/pinyin-tones`, `data/pinyin-character-map`, `data/strokes`, `characters/:glyph`) — both zero-dep reference modules, the cheapest ports.

**ACs:** All radicals + foundations routes ported on the **current** content; parity green; no wait for epic-27 (27 re-touches data on Nest later); no other zone touched.

**Gate:** 24-8 (serial order); **not** gated on epic-27 M1. **Docs:** stub — full BR/IMP authored when 24-9 runs.

### 24-10 — Audio + Health Port

**_(STUB — absorbs epic-25 F5 TTS surface)_**

**Goal:** Port `audio` (`POST /v1/tts`; `AudioService` facade over `AudioSynthesizer`/`AudioPathCache`/`AudioUrlSigner`) and `health` (consumes `AudioServiceLike` via Nest DI — replaces the direct `modules/audio/index.js` import).

**ACs:** TTS route ported with the **calibrated** `optionalAuth` semantics; parity harness green; health uses Nest-provided `AudioServiceLike` (no direct cross-module import in Nest land); audio URL-signing/path-cache identical (mocked-GCS integration test); **cache-first free-for-guests (F5) verified in-port**; guest-visible generation stays counter-gated (mechanics in 29).

**Gate:** 24-4 + 24-5 (calibrated `optionalAuth`). **Docs:** stub — full BR/IMP authored when 24-10 runs.

### 24-11 — Review Port + SRS Schema

**_(STUB — absorbs epic-25 P0-1 structural + epic-28 SrsCardState additive)_**

**Goal:** Port `review` (3 routes: `GET /v1/review/items`, `GET /v1/review/due-count`, `POST /v1/review/result`) with the **structural P0-1 fix** (Nest repo rejects `undefined` userId at type/guard level) + the **absorbed additive `SrsCardState` schema/enum + reserved pgvector**; review re-points with interval-doubling preserved; calibrated `requireAuth`.

**ACs:** 3 review routes ported; parity green; `findByUserAndTypes`/`countDue` structurally reject `undefined` userId (regression test re-authored in Nest land); additive `SrsCardState` migration (new table/enum/vector, backfill, re-point; `ReviewItem` columns kept until 34/28 cleanup) satisfies the D1 additive-only gate; interval-doubling preserved (no FSRS semantics — that's 34); calibrated `requireAuth` applied; stale `ReadersAudioController.test.ts` rewritten/removed here or flagged for 24-12.

**Gate:** 24-5 (calibrated guards). **Docs:** stub — full BR/IMP authored when 24-11 runs.

### 24-12 — Readers Port

**_(STUB — absorbs epic-25 F5 passage-audio)_**

**Goal:** Port `readers` — the largest module (11 routes; `SegmenterService`/`PassageGenerationService`/`ReadersAudioService` + DB-backed 5/day rate-limit).

**ACs:** All 11 readers routes ported (incl. `:id`-nested passages/sessions/bookmarks; `createReadersRoutes(controller)` factory → standard Nest controllers); parity green; `ReadersAudioService` uses Nest-injected audio (no direct cross-module import); passage-audio uses the **calibrated** `optionalAuth` (cache-first-free for guests, F5); 5/day generation rate-limit 429 + envelope matches Express incl. real-IP; required auth guards on user-scoped routes.

**Gate:** 24-10 (audio) + 24-3 + 24-4 + 24-5. **Docs:** stub — full BR/IMP authored when 24-12 runs.

### 24-13 — Quiz + Progression Port

**_(STUB — absorbs epic-26 M1 backend shape + epic-25 F6 progression; FE quiz fixes C)_**

**Goal:** Resolve the `progression ↔ quiz` cycle (primary `forwardRef(() => QuizModule)`/`@Inject(forwardRef(() => QuizService))`; fallback = preserve re-injection via `setQuizService` provider factory) and port both modules together — the backend engine ported **correctly** (no backend bug canonized).

**ACs:** Circular-DI resolved with a recorded ADR (no mutable setter in Nest land unless documented fallback); all 15 quiz+progression routes ported (`quiz`: 7 + `POST /v1/quiz/feedback` + 5 strategies + SandhiDrill; `progression`: 7 routes incl. foundation-progress/phase-gate/gates/radical-progress); parity green (status + body + envelope); quiz strategies registry + SandhiDrill ported with the **correct** backend shape; progression guest branch unified to the calibrated gate (24-7); calibrated `optionalAuth` on guest quiz submit; **FE quiz-engine fixes explicitly NOT absorbed (C-declared, tracked in 26)**.

**Gate:** 24-5 + 24-7 + 24-12 (serial order). **Docs:** stub — full BR/IMP authored when 24-13 runs.

### 24-14 — Release-Safety Cutover Gate

**_(STUB — absorbs A-items P1/P2/T1/O1/O2/D1/D2/R1/DOC)_**

**Goal:** Own the Definition of Done + release checklist as the hard pre-flight gate that 24-15 cannot flip without, plus post-flip smoke + rollback + watch-window verification. Serial-flipped: S1 (P0-1) = absorbed (24-1 + 24-11); S2 (guest-auth) = absorbed (24-5/24-7/24-8/24-10/24-13); quiz-FE bugs = C-declared (tracked in 26); schema = absorbed-additive (24-11).

**ACs:** Release checklist artifact committed (every §1 line S1–S2/P1–P2/T1/O1–O2/D1–D2/R1–R2/DOC/G with status/evidence pointer); A/C ownership map recorded + signed off; pre-flight sign-off (S1, S2, P1 parity 100%, T1 full+integration green) → only then may 24-15 flip; post-flip smoke (`/api/v1/health` + register/login + one data route) green; watch-window procedure documented + executed (via 24-3 requestId logs) before Express deletion; rollback runbook verified (`start:express` for one release or redeploy-previous).

**Gate:** 24-13 (all modules ported) — immediately before 24-15. **Docs:** stub — full BR/IMP authored when 24-14 runs.

### 24-15 — Deployment Cutover + Retire Dual-Mode + Docs Refresh

**_(STUB — absorbs A-items 2.6/2.7/2.13/2.16/2.17/2.18)_**

**Goal:** Make Nest the production entry, delete the Express surface, and refresh the API/docs contract — so epics 25–28 land on NestJS.

**ACs:** Production boots from the Nest entry on Railway; `healthcheckPath` green; frontend regression-free (parity harness 100% green across all ~63 routes pre-flip, gated by 24-14); Express controllers/routes/`req.xController`/`express.d.ts` augmentation deleted (or gated behind `start:express` per ADR); **migration-safety pre-flight — pending Prisma migrations reviewed, release deploy additive-only, `db:migrate:deploy` clean**; **openapi ↔ `ROUTE_PATTERNS` ↔ Nest registry reconciliation (no dead/misrouted endpoints)**; **`/api-docs` + `/api-docs.json` served from Nest (or removal documented)**; **`validateConfig()` fail-fast preserved on Nest boot**; **rollback runbook + post-flip smoke + watch window (per 24-14)**; `docs/architecture.md` + conventions/KB docs updated + truth-checked; retired/stale test artifacts removed; key controller tests converted to Nest e2e.

**Gate:** 24-14 (release-safety gate passes). **Docs:** stub — full BR/IMP authored when 24-15 runs.

## Implementation Plan

Serial order (single engineer): **24-1 → 24-2 → 24-3 → 24-4 → 24-5 → 24-6 → 24-7 → 24-8 → 24-9 → 24-10 → 24-11 → 24-12 → 24-13 → 24-14 → 24-15**.

1. **24-1**: P0-1 stopgap (leak closed on Express, T1 baseline recorded + triaged) — FIRST, ships independently.
2. **24-2 → 24-3 → 24-4**: unblocked runway (shell → HTTP parity → shared substrate).
3. **24-5 → 24-6**: auth guards (calibrated, F6) + auth module port.
4. **24-7**: guest identity calibration + minimal FE lockstep (sets the calibrated identity shape for 24-13 + the FE shell; the 24-5 guards target the spec).
5. **24-8 → 24-9 → 24-10**: characters+mnemonics → radicals+foundations (current content) → audio+health.
6. **24-11 → 24-12 → 24-13**: collision-core — review + `SrsCardState` additive schema → readers → quiz+progression (heaviest batch).
7. **24-14**: release-safety gate (pre-flight before 24-15's flip).
8. **24-15**: cutover — Nest production entry, Express deleted, docs refreshed.

Serial-gating summary: **no external epic gates** — absorbed-scope stories (24-1/24-5/24-7/24-8/24-10/24-11/24-13) carry their former epic's work **inside** the epic. Timeline ≈5 weeks (4–7). 24-14 is the hard pre-flight immediately before 24-15.

## Risks & Mitigations

See the epic [BR README](../../business-requirements/epic-24-nestjs-shell-migration/README.md#risks--mitigations) for the full risk register (severity + mitigation + rollback) — now **18 items** = the 12 migration risks (renumbered to the serial story numbers) + the 6 serial risks **R1–R6**. Highlights: (1) dev-only dual-mode confirmation — High; (2) Node 24 reconciliation in 24-2 — Low; (3) unverified test baseline — Medium (24-1, epic-level hard precondition); (4) radicals/foundations on current content — Low (24-9); (5) retain `express-rate-limit` vs `@nestjs/throttler` — Medium (record in 24-3); (6) `forwardRef` vs re-injection for `progression↔quiz` — High (record in 24-13); (7) prod entry path + `nest build` at cutover — Medium (24-15); (8) stale `openapi.yaml` reconciliation — Medium (24-15); (9) Express retirement shape — Medium (24-15); (10) absorbed 25–28 surfaces ported against the calibrated shape — Medium (ADR-24-B); (11) shared-track single-PR discipline — High; (12) absorbed `SrsCardState` schema migration on the review table — Med-High (additive-only); **R1 roadmap stall — High; R2 single-point-of-failure — High; R3 parity canonizing pre-26 quiz-FE bugs — Low-Med (C-declared, tracked in 26); R4 schema migration risk (additive) — Med-High; R5 FE lockstep coupling — Med; R6 auth-surface double-touch — Med.**

## ⚠️ RETIRED — ASP.NET Core 8 migration material (historical, preserved for traceability)

> **RETIRED 2026-08-17** — The ASP.NET Core 8 migration material below is **retired**. Its revalidation gate is unmet and **D1 (NestJS 11, owner-approved 2026-08-17) rejects .NET**. The active scope is the D7 NestJS shell-swap above. This material is preserved for traceability only; do not build from it.

---

## Historical appendix — .NET Backend Migration & Service Consolidation

## Epic Summary

**Goal:** Migrate all backend services from Node.js/Express to ASP.NET Core 8 with clean architecture, achieving production-grade .NET implementation while validating performance improvements and team learning objectives.

**Key Points:**

- ASP.NET Core 8 Web API with clean architecture (Controllers â†’ Services â†’ Repositories â†’ Infrastructure)
- Entity Framework Core 8 connects to existing PostgreSQL database (shared with Node.js during migration)
- JWT authentication compatible with Node.js tokens (same secret, HS256 algorithm) for seamless cutover
- Service-by-service migration: Progress (learning) â†’ TTS (Google SDK) â†’ Conversation (Gemini) â†’ Auth (ASP.NET Identity)
- Blue-green deployment with traffic routing (10% â†’ 50% â†’ 100%) and automated rollback on error spikes

**Status:** Planned

**Last Update:** February 2, 2026

## Technical Overview

This epic executes a gradual migration from Node.js backend to ASP.NET Core 8, prioritizing team learning through hands-on implementation of the most complex service first (Progress Service). The migration strategy minimizes risk by running both backends in parallel with traffic routing, enabling instant rollback.

**Migration Philosophy:**

- **Learn by doing**: Progress Service chosen first for maximum learning (spaced repetition algorithm, complex business logic)
- **Validate incrementally**: Each service cutover proves approach before proceeding
- **Measure everything**: Performance, error rates, latency tracked before/after migration
- **Zero downtime**: Blue-green deployment with gradual traffic shift

**Current Node.js Architecture:**

```
apps/backend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ controllers/          # HTTP layer
â”‚   â”œâ”€â”€ core/
â”‚   â”‚   â””â”€â”€ services/         # Business logic (framework-agnostic)
â”‚   â”œâ”€â”€ repositories/         # Data access
â”‚   â””â”€â”€ routes/               # Express routes
â”œâ”€â”€ services/                 # External integrations (TTS, Gemini)
â””â”€â”€ prisma/                   # Database ORM
```

**Target .NET Architecture:**

```
apps/backend-dotnet/          # New ASP.NET Core 8 project
â”œâ”€â”€ Controllers/              # HTTP layer (ASP.NET Core MVC)
â”œâ”€â”€ Services/                 # Business logic (C# interfaces + impl)
â”œâ”€â”€ Repositories/             # Data access (EF Core)
â”œâ”€â”€ Models/                   # EF Core entities
â”œâ”€â”€ Infrastructure/           # External integrations (Google SDK)
â”œâ”€â”€ Middleware/               # JWT validation, error handling
â””â”€â”€ Program.cs                # Startup configuration
```

**Key Technical Challenges:**

1. **EF Core Schema Mapping**: Must match existing Prisma schema exactly (zero migration downtime)
2. **JWT Token Compatibility**: .NET must validate tokens issued by Node.js (same secret + algorithm)
3. **Google Cloud SDK Integration**: C# SDK differs from Node.js (different API patterns)
4. **Gemini API Integration**: No official C# SDK (use HttpClient with manual serialization)
5. **Performance Validation**: Prove .NET faster than Node.js (justifies migration effort)

## Architecture Decisions

1. **ASP.NET Core 8 over .NET Framework 4.8** â€” Cross-platform, modern async patterns, active development, free hosting options (Azure/Railway/Render); runs on Linux containers

2. **Entity Framework Core 8 over Dapper** â€” Easier learning curve (similar to Prisma ORM), type-safe LINQ queries, migrations management; tradeoff: 10-20% slower than Dapper (acceptable for current scale)

3. **Clean Architecture pattern** â€” Controllers â†’ Services â†’ Repositories mirrors Node.js Epic 13 structure; business logic in Services layer portable to other frameworks

4. **Service-by-service migration** â€” Lower risk than big bang rewrite; validates approach incrementally; allows per-service rollback; both backends run in parallel 4-8 weeks

5. **ASP.NET Identity vs Custom JWT (TBD)** â€” Decision deferred to Story 18.8; Identity provides full user management framework, Custom JWT lightweight but requires manual implementation

6. **Blue-green deployment strategy** â€” Both backends deployed simultaneously; traffic routed via environment variable or load balancer; instant rollback on error spikes

## Technical Implementation

### Architecture

```
Frontend (React + Axios)
    â†“
API Gateway / Environment Variable (USE_DOTNET_BACKEND=true/false)
    â†“
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Node.js Backend (Current)  â”‚   .NET Backend (Target)    â”‚
â”‚   Express + Prisma           â”‚   ASP.NET Core + EF Core   â”‚
â”‚   Port 3001                  â”‚   Port 5000                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â†“
            PostgreSQL Database
            (Shared during migration)
```

**Service Migration Flow:**

```
Phase 1: Foundation (Stories 18.1-18.4)
    Create ASP.NET Core project
    â†“
    Configure EF Core with scaffold-dbcontext (reverse engineer from PostgreSQL)
    â†“
    Implement JWT validation middleware (same secret as Node.js)
    â†“
    Implement Progress Service in C# (ProgressController â†’ ProgressService â†’ ProgressRepository)
    â†“
    Unit tests + integration tests
    â†“
    Deploy to staging, smoke tests

Phase 2: Production Cutover (Story 18.5)
    Deploy .NET Progress Service to production
    â†“
    Route 10% traffic to .NET (environment variable or load balancer)
    â†“
    Monitor 24 hours (error rate, latency, throughput)
    â†“
    Increase to 50% if stable
    â†“
    Increase to 100% if stable
    â†“
    Deprecate Node.js Progress Service

Phase 3: Additional Services (Stories 18.6-18.8)
    Repeat Phase 1-2 for TTS Service
    â†“
    Repeat Phase 1-2 for Conversation Service
    â†“
    Repeat Phase 1-2 for Auth Service (most complex, last)

Phase 4: Node.js Sunset (Story 18.9)
    100% traffic to .NET backend
    â†“
    Archive Node.js code (git tag: nodejs-final-v1.0)
    â†“
    Remove Node.js deployment from Railway/Render
    â†“
    Update frontend to remove USE_DOTNET_BACKEND flag
```

### API Endpoints

**All endpoints maintain identical contract to Node.js version** (OpenAPI spec must match exactly):

**Progress Service:**

- `GET /api/progress` - Fetch user progress (EF Core LINQ query)
- `POST /api/progress/review` - Record review (spaced repetition calculation in C#)
- `POST /api/progress/update` - Update word progress
- `POST /api/progress/batch` - Batch updates

**TTS Service:**

- `POST /api/audio/generate` - Generate audio (Google.Cloud.TextToSpeech C# SDK)

**Conversation Service:**

- `POST /api/conversation/generate` - Generate conversation (HttpClient to Gemini API)
- `GET /api/conversation/:id` - Retrieve cached conversation

**Auth Service:**

- `POST /api/auth/login` - Login (ASP.NET Identity or custom JWT)
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Component Relationships

```
ASP.NET Core Web API (Program.cs)
    â†“
Middleware Pipeline:
    - Exception Handler Middleware (global error handling)
    - JWT Authentication Middleware (validates httpOnly cookie)
    - CORS Middleware (allow frontend origin)
    â†“
Controllers (ProgressController, TTSController, ConversationController, AuthController)
    â†“
Services (IProgressService, ITTSService, IConversationService, IAuthService)
    - Business logic (spaced repetition, conversation validation)
    - Framework-agnostic (pure C#)
    â†“
Repositories (IProgressRepository, IUserRepository)
    - EF Core DbContext
    - LINQ queries + async/await
    â†“
PostgreSQL Database
    - Same schema as Node.js (Prisma migrations)
    â†“
External Infrastructure:
    - Google Cloud TTS (Google.Cloud.TextToSpeech NuGet package)
    - Google Cloud Storage (Google.Cloud.Storage NuGet package)
    - Gemini API (HttpClient + manual JSON serialization)
```

### Dependencies

**New NuGet Packages:**

- `Microsoft.AspNetCore.App` (ASP.NET Core 8 metapackage)
- `Microsoft.EntityFrameworkCore` (^8.0.0) - ORM
- `Microsoft.EntityFrameworkCore.Design` (^8.0.0) - EF Core tools
- `Npgsql.EntityFrameworkCore.PostgreSQL` (^8.0.0) - PostgreSQL provider
- `Microsoft.AspNetCore.Authentication.JwtBearer` (^8.0.0) - JWT middleware
- `Google.Cloud.TextToSpeech.V1` (^3.0.0) - TTS SDK
- `Google.Cloud.Storage.V1` (^4.0.0) - GCS SDK
- `System.IdentityModel.Tokens.Jwt` (^7.0.0) - JWT token handling
- `Swashbuckle.AspNetCore` (^6.5.0) - Swagger/OpenAPI generation

**Testing Packages:**

- `xUnit` (^2.6.0) - Testing framework
- `Moq` (^4.20.0) - Mocking library
- `FluentAssertions` (^6.12.0) - Readable assertions
- `Microsoft.AspNetCore.Mvc.Testing` (^8.0.0) - Integration testing

**New Files:**

```
apps/backend-dotnet/
â”œâ”€â”€ Controllers/
â”‚   â”œâ”€â”€ ProgressController.cs
â”‚   â”œâ”€â”€ TTSController.cs
â”‚   â”œâ”€â”€ ConversationController.cs
â”‚   â””â”€â”€ AuthController.cs
â”œâ”€â”€ Services/
â”‚   â”œâ”€â”€ IProgressService.cs
â”‚   â”œâ”€â”€ ProgressService.cs
â”‚   â”œâ”€â”€ ITTSService.cs
â”‚   â”œâ”€â”€ TTSService.cs
â”‚   â”œâ”€â”€ IConversationService.cs
â”‚   â”œâ”€â”€ ConversationService.cs
â”‚   â”œâ”€â”€ IAuthService.cs
â”‚   â””â”€â”€ AuthService.cs
â”œâ”€â”€ Repositories/
â”‚   â”œâ”€â”€ IProgressRepository.cs
â”‚   â”œâ”€â”€ ProgressRepository.cs
â”‚   â”œâ”€â”€ IUserRepository.cs
â”‚   â””â”€â”€ UserRepository.cs
â”œâ”€â”€ Models/
â”‚   â”œâ”€â”€ User.cs
â”‚   â”œâ”€â”€ Progress.cs
â”‚   â””â”€â”€ StudyStreak.cs
â”œâ”€â”€ Infrastructure/
â”‚   â”œâ”€â”€ GoogleCloudTTSClient.cs
â”‚   â”œâ”€â”€ GoogleCloudStorageClient.cs
â”‚   â””â”€â”€ GeminiApiClient.cs
â”œâ”€â”€ Middleware/
â”‚   â”œâ”€â”€ ExceptionHandlerMiddleware.cs
â”‚   â””â”€â”€ JwtValidationMiddleware.cs
â”œâ”€â”€ DTOs/
â”‚   â”œâ”€â”€ ProgressDto.cs
â”‚   â”œâ”€â”€ ReviewDto.cs
â”‚   â””â”€â”€ UserDto.cs
â”œâ”€â”€ Data/
â”‚   â””â”€â”€ AppDbContext.cs
â”œâ”€â”€ Program.cs
â”œâ”€â”€ appsettings.json
â”œâ”€â”€ appsettings.Development.json
â””â”€â”€ backend-dotnet.csproj
```

### Testing Strategy

**Unit Tests (per service):**

- `ProgressServiceTests.cs` - Test spaced repetition algorithm in isolation
- `TTSServiceTests.cs` - Mock Google SDK, verify request formatting
- `ConversationServiceTests.cs` - Mock Gemini API, verify response parsing
- `AuthServiceTests.cs` - Test JWT generation/validation logic

**Integration Tests:**

- `ProgressControllerTests.cs` - Test HTTP endpoints with in-memory database
- `JwtAuthenticationTests.cs` - Test token validation middleware
- `DatabaseTests.cs` - Verify EF Core queries produce expected results

**Performance Tests:**

- `LoadTestComparison.cs` - Apache Bench or k6 load testing
  - Measure Node.js baseline (100 req/s, p95 latency)
  - Measure .NET performance (target: match or exceed Node.js)
  - Compare throughput, latency, error rates

**Manual Testing:**

- Deploy both backends to staging
- Use Postman to test all endpoints
- Verify JWT tokens work across both backends
- Test database writes from .NET visible in Node.js (shared DB)

### Performance Considerations

**Optimization Techniques:**

- `AsNoTracking()` on read-only EF Core queries (reduces memory overhead)
- Compiled queries for frequently-executed LINQ (reduce compilation time)
- Response caching middleware for GET endpoints (reduce database hits)
- Connection pooling (EF Core default, configure pool size)
- Async/await everywhere (ASP.NET Core async-first architecture)

**Expected Performance Improvements:**

- Compiled C# code faster than JavaScript V8 for CPU-intensive tasks (spaced repetition calculations)
- Better multi-threading for concurrent requests (Node.js single-threaded)
- Lower memory usage for large datasets (C# value types vs. JS objects)

**Monitoring Metrics:**

- Request latency (p50, p95, p99) - Target: <200ms p95
- Throughput (requests per second) - Target: >100 req/s
- Error rate - Target: <0.1%
- Memory usage - Target: <512MB
- CPU usage - Target: <50% average

**Benchmarking Tools:**

- Apache Bench (`ab -n 1000 -c 10 http://localhost:5000/api/progress`)
- k6 load testing (JavaScript-based load tester)
- dotTrace profiler (identify performance bottlenecks)
- Application Insights (production monitoring)

### Security Considerations

**JWT Token Validation:**

- Same secret key as Node.js (shared `JWT_SECRET` environment variable)
- Same algorithm (HS256) - verify in Node.js and .NET
- Validate expiry, issuer, audience claims
- httpOnly cookies prevent XSS attacks

**Database Security:**

- Connection string in environment variables (not appsettings.json)
- EF Core parameterized queries prevent SQL injection
- Use PostgreSQL roles for least-privilege access

**API Security:**

- CORS middleware configured with explicit origins (not wildcard)
- Rate limiting middleware (prevent abuse)
- Input validation with Data Annotations (`[Required]`, `[MaxLength]`)
- Output sanitization (prevent XSS in API responses)

### Migration Strategy

**Phase 1: Foundation & Learning (Weeks 1-2)**

- **Story 18.1**: Create ASP.NET Core 8 project with clean architecture folders
- **Story 18.2**: Scaffold EF Core models from existing PostgreSQL database
- **Story 18.3**: Implement JWT authentication middleware compatible with Node.js tokens
- **Story 18.4**: Implement Progress Service in C# with full business logic

**Phase 2: Production Validation (Week 3)**

- **Story 18.5**: Deploy Progress Service to production
  - 10% traffic for 24 hours â†’ monitor metrics
  - 50% traffic for 24 hours â†’ monitor metrics
  - 100% traffic for 48 hours â†’ deprecate Node.js Progress Service

**Phase 3: Additional Services (Weeks 4-5)**

- **Story 18.6**: Migrate TTS Service (Google Cloud TTS C# SDK)
- **Story 18.7**: Migrate Conversation Service (HttpClient to Gemini API)
- Follow same cutover process (10% â†’ 50% â†’ 100%)

**Phase 4: Auth & Sunset (Weeks 6-7)**

- **Story 18.8**: Migrate Auth Service (ASP.NET Identity or custom JWT)
- **Story 18.9**: 100% traffic to .NET backend, archive Node.js code

**Phase 5: Stabilization (Week 8)**

- Monitor production metrics (latency, error rates, throughput)
- Performance tuning (optimize slow queries, add caching)
- Documentation finalization (architecture, deployment runbooks)
- Team knowledge transfer (pair programming, code reviews)

**Rollback Plan (per service):**

1. Monitor error rate spike (>0.5% threshold)
2. Automated alert triggers rollback script
3. Update environment variable `USE_DOTNET_BACKEND=false`
4. Traffic instantly reverts to Node.js service
5. Investigate .NET issue in staging
6. Fix and redeploy before next cutover attempt

### Documentation Updates

- Update `docs/architecture.md` with .NET backend architecture diagram
- Create `docs/guides/dotnet-conventions.md` for C# coding standards
- Create `docs/deployment/dotnet-deployment.md` for production deployment
- Update API spec: `apps/backend-dotnet/docs/api-spec.md`

### Code Examples

**Node.js ProgressService (Current):**

```javascript
// apps/backend/src/core/services/ProgressService.js
class ProgressService {
  async recordReview(userId, wordId, confidence) {
    const nextReviewDate = this.calculateNextReview(confidence);
    return await this.progressRepository.save({ userId, wordId, nextReviewDate });
  }

  calculateNextReview(confidence) {
    const baseDelay = 1; // days
    const maxDelay = 30; // days
    return Math.min(maxDelay, baseDelay * Math.pow(2, confidence * 5));
  }
}
```

**C# ProgressService (Target):**

```csharp
// apps/backend-dotnet/Services/ProgressService.cs
public class ProgressService : IProgressService
{
    private readonly IProgressRepository _progressRepository;

    public ProgressService(IProgressRepository progressRepository)
    {
        _progressRepository = progressRepository;
    }

    public async Task<Progress> RecordReviewAsync(int userId, string wordId, int confidence)
    {
        var nextReviewDate = CalculateNextReview(confidence);
        return await _progressRepository.SaveAsync(userId, wordId, nextReviewDate);
    }

    private DateTime CalculateNextReview(int confidence)
    {
        const int baseDelay = 1; // days
        const int maxDelay = 30; // days
        var delay = Math.Min(maxDelay, baseDelay * Math.Pow(2, confidence * 5));
        return DateTime.UtcNow.AddDays(delay);
    }
}
```

**Key Differences:**

- C# uses interfaces for dependency injection (`IProgressRepository`)
- Async methods suffixed with `Async` (C# convention)
- `DateTime.UtcNow` vs. JavaScript `Date.now()`
- Strong typing (`int`, `string`) vs. JavaScript dynamic types

**EF Core DbContext:**

```csharp
// apps/backend-dotnet/Data/AppDbContext.cs
public class AppDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Progress> Progress { get; set; }
    public DbSet<StudyStreak> StudyStreaks { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Match existing Prisma schema exactly
        modelBuilder.Entity<Progress>()
            .ToTable("progress")
            .HasKey(p => p.Id);

        modelBuilder.Entity<Progress>()
            .Property(p => p.UserId)
            .HasColumnName("user_id");

        // Configure relationships
        modelBuilder.Entity<Progress>()
            .HasOne(p => p.User)
            .WithMany(u => u.ProgressRecords)
            .HasForeignKey(p => p.UserId);
    }
}
```

**JWT Middleware Configuration:**

```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]))
        };

        // Read token from httpOnly cookie (same as Node.js)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["token"];
                return Task.CompletedTask;
            }
        };
    });
```

---

**Related Documentation:**

- [Epic 18 BR](../../business-requirements/archive/epic-18-foundations/README.md)
- Story 18.1 Implementation _(not yet created)_
- Story 18.2 Implementation _(not yet created)_
- Story 18.3 Implementation _(not yet created)_
- Story 18.4 Implementation _(not yet created)_
- Story 18.5 Implementation _(not yet created)_
- Story 18.6 Implementation _(not yet created)_
- Story 18.7 Implementation _(not yet created)_
- Story 18.8 Implementation _(not yet created)_
- Story 18.9 Implementation _(not yet created)_
- [Architecture Overview](../../architecture.md)
- [Epic 13: Production Backend Architecture](../archive/epic-13-production-backend-architecture/README.md)
- [Code Conventions](../../guides/conventions/backend.md)
- [Epic 13 Production Architecture](../archive/epic-13-production-backend-architecture/README.md)

---

## Migration Success Criteria

**Technical Validation:**

- [ ] All EF Core queries match Prisma output (database audit)
- [ ] JWT tokens issued by Node.js validate in .NET (cross-backend test)
- [ ] Performance meets baseline: p95 latency <200ms, throughput >100 req/s
- [ ] Error rate <0.1% sustained for 7 days post-cutover
- [ ] Zero data loss or corruption (database integrity checks)

**Business Validation:**

- [ ] Team proficient in C# and ASP.NET Core (code review quality)
- [ ] No user-reported bugs related to backend migration
- [ ] $1000 customer contract continues without disruption
- [ ] Operational costs reduced (measure after 30 days)

**Documentation Validation:**

- [ ] New developers can set up .NET backend in <30 minutes
- [ ] All API endpoints documented with examples
- [ ] Deployment runbooks tested by 2+ team members
- [ ] Troubleshooting guide includes common .NET issues

**Production Readiness:**

- [ ] Monitoring dashboards show .NET metrics (latency, errors, throughput)
- [ ] Alerting configured for error spikes (>0.5% threshold)
- [ ] Backup/restore procedures tested
- [ ] Node.js code archived with rollback instructions

**Learning Objectives:**

- [ ] Team can implement new .NET endpoints without guidance
- [ ] Team understands EF Core migrations and LINQ queries
- [ ] Team can debug .NET performance issues with profiler
- [ ] Team confident in ASP.NET Core deployment pipeline
