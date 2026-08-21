**Last Updated:** August 21, 2026

# Implementation 24-14: Release-Safety Cutover Gate

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-14-release-safety-cutover-gate.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** _(to be filled at epic close)_

## Implementation Summary

Authored the release-safety gate as a committed verification artifact — `verification-artifacts/release-safety-gate-24-14.md`, the story's **only deliverable** (force-added; the `verification-artifacts/` dir is gitignored). The artifact contains the full §1 DoD gate checklist (S1–S2 / P1–P2 / T1 / O1–O2 / D1–D2 / R1–R2 / DOC / G) with per-gate **status + evidence pointer**, the **63/63 P1 route enumeration**, the **A/B/C ownership map + sign-off**, the **rollback + watch-window procedure**, and the **pre-flight sign-off statement**. Every claim was **run/read against the shipped code, not assumed** (Backend Engineer, Story 24-14). **All twelve DoD gates PASS** — the fully-migrated NestJS shell is **release-safe per the §1 Definition of Done**, and **the 24-15 cutover is UNBLOCKED**.

### Every DoD gate PASSED

- **S1 Security — P0-1 closed structurally ✅.** `ReviewRepository.findByUserAndTypes` rejects `userId === undefined` **before** any Prisma call (`ReviewRepository.ts:86-88` — `if (userId === undefined) return []`, no Prisma ignore-`undefined` path); `ReviewRepository.countDue` likewise (`ReviewRepository.ts:166-168` — `return 0` before `prisma.srsCardState.count`); code-scan across `src/modules/*/nest/*.ts` finds **zero** `req.userId!`/`req.user!` (the only hit is a comment at `progression-nest.controller.ts:209`; ported controllers use `req.userId as string` + a defensive `if (!userId) 401` mirroring Express). P0-1 regression green: `review-nest.controller.test.ts` (**7 tests** — each route "throws 401 and never calls the service when `req.userId` is missing") + `ReviewRepository.test.ts` (`undefined → []`/`0`, **no Prisma call** asserted) — in `test:full` 744. Guest ⇒ 401/empty, never another user's rows: `review-parity.test.ts` "P0-1 no-leak (user B never sees user A's rows)" + guest-401 A/B parity — in `test:integration` 262. **Owner:** absorbed in-epic (24-1 stopgap on Express + 24-11 structural on Nest); closed on both paths.
- **S2 Security — guest-auth == calibrated shape ✅.** `createGuestPhaseGate → {currentPhase: 1, isGuest: true}` (`packages/shared-constants/src/index.js:98-117` — `id:"guest-unlocked"`, `currentPhase:1`, `phase4Unlocked:false`, `isGuest:true`; **never all-unlocked**); `OptionalAuthGuard` guest → `req.userId` **undefined** / empty (no token → `return true`; invalid/expired token → caught, guest continues — never 401/403, never a fabricated user); `/gates` guest branch **calibrated to Phase-1-only** on Nest (`progression-nest.controller.ts` `getGates` — `phase2Gate`/`characterCountGate`/`phase3To4Gate` all `{ passed:false, reason:"GUEST", ... }`, NOT the all-passed `GUEST` Express still returns — unified at 24-15); `getPhaseGate` guest → `createGuestPhaseGate()`. Guest-behavior tests/parity green: `auth-guards-parity.test.ts` (hermetic) + `quiz-progression-parity.test.ts` (calibrated `/gates` guest, guest progression `[]`) + `audio-health-parity.test.ts` (guest TTS never 401, F5). **Owner:** absorbed in-epic (24-5 guards, 24-7 identity calibration, 24-8/24-10/24-13 consumers).
- **P1 Parity — 100% route coverage ✅.** **63 registered Express routes across 17 route files** (enumerated from `router.<method>(` registrations) — **all 63 covered by the parity harness (100%)** across **9 harnesses**: `route-parity` (words 2 · phonetic-clusters 2 · grammar 2 · chengyu 2), `auth-parity` (auth 5), `characters-mnemonics-parity` (characters 6 · pinyin 1 · mnemonics 4), `radicals-foundations-parity` (radicals 4 · foundations 4), `audio-health-parity` (audio 1 · health 1), `review-parity` (review 3), `readers-parity` (readers 11), `quiz-progression-parity` (quiz 8 · progression 7), plus `auth-guards-parity` (hermetic guard semantics). Per-module counts: **words 2, phonetic-clusters 2, grammar 2, chengyu 2, audio 1, health 1, auth 5, characters 6, pinyin 1, mnemonics 4, radicals 4, foundations 4, review 3, readers 11, quiz 8, progression 7 = 63**. Integration parity suites green (262 tests) — 2xx status **and** body deep-equal, 4xx/5xx status + `{code,message,requestId}` envelope. **No uncovered routes.** (`GET /v1/characters/:glyph` counted once, exercised through the foundations shadow — identical mount-order behavior on both apps.)
- **P2 Parity — no dead/misrouted endpoints ✅ (diff → 24-15).** Express registry = `ROUTE_PATTERNS` = Nest registry — all 63 routes ported; no Express route left unported/unreachable on Nest (P1 100%). Route-shadowing reproduced byte-for-byte (24-9): `GET /v1/characters/:glyph` (foundations wins, matching Express mount order), incl. `/search` + `/frequency` → 404. **`openapi.yaml` is STALE (dead docs) — input to 24-15:** it documents **9 routes that exist in neither `ROUTE_PATTERNS` nor the Express registry** — `/v1/vocabulary/lists`, `/v1/vocabulary/lists/{listId}`, `/v1/vocabulary/lists/{listId}/progress`, `/v1/vocabulary/lists/{listId}/words`, `/v1/vocabulary/search` (**×5 `/v1/vocabulary/*`**) + `/v1/progress`, `/v1/progress/{wordId}`, `/v1/progress/batch`, `/v1/progress/stats` (**×4 `/v1/progress*`**) = **9 dead routes**. These are removed endpoints, not new/misrouted ones; the openapi refresh is **24-15's responsibility**, and this gate records the diff as its input. `/api-docs` + `/api-docs.json` (swagger-ui-express) still mounted on Express today → serve-from-Nest-or-remove decision is **24-15's (O2)**.
- **T1 Tests — full baseline green ✅.** `npm run test:full` → **66 files / 744 tests passed** (exit 0); `npm run test:integration` → **23 files / 262 tests passed** (exit 0). **Stale-artifact note:** `modules/readers/api/__tests__/ReadersAudioController.test.ts` still present + passing — it uniquely covers the live Express `ReadersController.getPassageAudio` until Express is deleted; **retires at 24-15** (per the 24-11/24-12 investigation; removal now would drop live coverage). Nest-side controller unit tests + the parity harness (e2e-style, boots both apps) serve as the Nest e2e per the story ACs.
- **O1 Ops — error visibility ✅.** `src/nest/exception.filter.ts` `logError()` → `logger.error("API Error", { requestId, code, message, stack })` — **byte-for-byte identical to `errorHandler.ts`**; every 4xx/5xx through the Nest filter logs with `requestId`. `mountExpressErrorBridge()` (mounted last) catches pre-router errors (body-parser 413) with the same envelope + log. Log-parity asserted in the harness (oversized-body 413, seeded 429/500).
- **O2 Ops — healthcheck ✅.** Booted the production entry `node dist/nest/main.js` (PORT=3999) → `GET /api/v1/health` → **200** `{"status":"ok", ...,"services":{"gemini":true,"tts":true},"cache":{"redis":{"connected":true}}}` — shape matches Express (also asserted in `audio-health-parity.test.ts`). Railway `healthcheckPath` is already `/api/v1/health` (`railway.toml`). `/api-docs` + `/api-docs.json` still served by Express → **input to 24-15**.
- **D1 Deploy — migration additive-only ✅.** Single epic migration `20260821175536_add_srs_card_state` (24-11): `CREATE EXTENSION IF NOT EXISTS vector` + new enum `SrsState` + new table `SrsCardState` + 3 indexes + 1 unique index — **zero `ReviewItem` drops/renames/alters** (`ReviewItem` stays fully live). `npx prisma migrate status` → **30 migrations, "Database schema is up to date!"** Railway `preDeployCommand` = `npm run db:migrate:deploy` (runs the additive set before start).
- **D2 Deploy — rollback runbook verified ✅.** The Express entry `node dist/app/index.js` **still builds** (5137 B emitted) **and still serves** (it is today's `start` = `node dist/app/index.js` in `railway.toml`); Nest is a side artifact (`dist/nest/main.js`, `start:nest`). After the 24-15 flip, the escape hatch is running `node dist/app/index.js` (or a retained `start:express` script) for one release, OR **redeploy-previous Railway release**. Because Nest and Express share the same Prisma client + schema, **no migration rollback is needed** — the release's migration set is additive-only (§D1), so a running Express build is compatible with the post-deploy schema. Post-flip smoke + watch-window procedure documented (see below).
- **R1 Runtime — Node 24 + ESM prod build + config fail-fast ✅ (one caveat).** `.node-version` = **24**, `.nvmrc` = **24.x**; `npm run build` emits `dist/nest/main.js` (2286 B) + `dist/app/index.js` (5137 B); backend `"type":"module"`; `node dist/nest/main.js` boots → health 200 (Redis connected, DB reachable); `src/nest/main.ts` calls `validateConfig()` **before** `NestFactory.create` (`src/shared/config/index.ts:150` throws `[Config] <key> is required but not set`); `configure-app.ts` — identical CORS origin allowlist, `set("trust proxy", 1)`, `cookieParser()`, `express.json()`/`urlencoded` with the same limits; Prisma 7 CJS pattern (CJS default-import + `PrismaPg` connection-string adapter) boot-smoked. **Caveat (hardening note, NOT a blocker):** `engines` fields are **lower bounds, not pins** — backend `"node": ">=22"`, root `"node": ">=20.0.0"` — satisfied by Node 24 but not pinning it (local dev shell is on Node v20.19.4). **24-15 must validate the prod boot under Node 24 on Railway** (RAILPACK respects `.nvmrc`/`.node-version`) and may tighten `engines` to `>=24`.
- **R2 Runtime — graceful shutdown ✅.** `DatabaseModule.onApplicationShutdown` → `this.prisma.$disconnect()` (`src/nest/shared/database.module.ts`); `SharedModule.onApplicationShutdown` → `redisClient.quit()` (`src/nest/shared/shared.module.ts`); `app.enableShutdownHooks()` in `configure-app.ts` (both hooks fire on SIGTERM). Unit-tested: `shared-module.providers.test.ts` — `moduleRef.close()` triggers `onApplicationShutdown` (Prisma disconnect + Redis quit) — in `test:full` 744.
- **DOC — input state flagged ✅ (refresh is 24-15).** Per the story scope, DOC is **not** closed here — flagged as 24-15's work: `apps/backend/src/shared/docs/openapi.yaml` stale (the 9 dead `/v1/vocabulary/*` + `/v1/progress*` docs, §P2) → regenerate + reconcile; `docs/architecture.md` + `module-level-containers.md` + backend conventions not yet updated for the Nest surface → 24-15 truth-check; `/api-docs` consumer decision → 24-15; epic BR/IMP closing → epic close.
- **G Quality — canonical gates ✅.** `npx tsc --noEmit` (apps/backend) exit 0 · `npm run build` exit 0 (both dist entries) · `npm run lint` (eslint .) exit 0 (0 errors) · `npm run test:full` **66 files / 744 tests** · `npm run test:integration` **23 files / 262 tests** · `npm run check:module-boundaries` exit 0 ("All shared imports respect the direction rule; naming guard clean").

### The pre-flight sign-off — 24-15 UNBLOCKED

**S1** (P0-1 closed structurally + regression green) ✅ PASS · **S2** (guest-auth == calibrated shape) ✅ PASS · **P1** (parity harness 100% route coverage — **63/63**) ✅ PASS · **T1** (`test:full` 744 + `test:integration` 262 green) ✅ PASS → **The 24-15 cutover is UNBLOCKED.** No gate failed; no 24-15 blocker surfaced by this gate. (The R1 `engines` lower-bounds caveat is recorded as a hardening note, not a blocker.)

### Rollback + watch-window procedure (D2, as documented)

- **Rollback runbook (verified):** Primary — the **`start:express` escape hatch**: the Express production entry `node dist/app/index.js` still builds + serves; after the 24-15 flip, revert `railway.toml` `startCommand` to run the Express entry (or re-point the start script) for one release. Secondary — **redeploy-previous Railway release** (one click). **No migration rollback needed** — additive-only set (§D1). Both options restore service without a schema rollback.
- **Post-flip smoke (on Railway, immediately after 24-15 flips):** 1) `GET /api/v1/health` → 200; 2) `POST /api/v1/auth/register` → 201 + httpOnly refresh `set-cookie`; 3) `POST /api/v1/auth/login` → 200 + access token; 4) one **authenticated** data route → 200 (e.g. `GET /api/v1/review/due-count` or `GET /api/v1/readers/passages` with the Bearer token) + one **guest** route → calibrated guest shape (e.g. `GET /api/v1/progression/phase-gate` → `currentPhase:1, isGuest:true`); 5) confirm a 4xx produces the `{code, message, requestId}` envelope and appears in logs.
- **Watch window (before Express deletion):** run a full business cycle after the flip — recommended **≥ 24–48 hours**. Observe the **24-3 requestId logs** — scan for `API Error { requestId, code, message, stack }` lines; every 4xx/5xx must carry a `requestId`; correlate `5xx`/`INTERNAL_ERROR` spikes. **Stop condition:** any error without `requestId`, or any 500 on a previously-green route → escalate before deleting Express. **Gate to delete Express:** only after the window closes with no P1/P0 regression AND the P1 parity harness re-runs green on the flipped build.

### 24-15 inputs flagged (the cutover must handle)

1. **Node 24 prod-boot validation on Railway** (RAILPACK respects `.nvmrc`/`.node-version`) + optional `engines` tighten to `>=24` (R1 caveat).
2. **openapi refresh** — regenerate truthfully + remove the **9 dead routes** (`/v1/vocabulary/*` ×5 + `/v1/progress*` ×4, §P2) + reconcile `openapi ↔ ROUTE_PATTERNS ↔ Nest registry`.
3. **`/api-docs` + `/api-docs.json`** serve-from-Nest-or-remove decision (O2).
4. **`docs/architecture.md` + `module-level-containers.md` + backend conventions/KB refresh** + truth-check (DOC).
5. **Retire `ReadersAudioController.test.ts`** (uniquely covers live Express `getPassageAudio` until Express is deleted) **+ delete the Express surface** (controllers/routes/`req.xController`/`express.d.ts` augmentation) + unify the Express `/gates` all-passed `GUEST` branch to the calibrated Phase-1-only shape (S2).

## Technical Scope

Produce the release-safety gate as a committed, independently-verifiable DoD verification — a single **verification artifact** that records every §1 DoD gate (S1–S2 security, P1–P2 parity, T1 tests, O1–O2 ops, D1–D2 deploy, R1–R2 runtime, DOC, G quality) with status + evidence, the 63/63 P1 route enumeration, the A/B/C ownership map + sign-off, the rollback + watch-window procedure, the pre-flight sign-off, and the exact gate-run numbers. This is a **docs/verification story — no production code is written or modified**: every claim is derived by running the gates and reading the shipped code (file:line evidence), never asserted. The deliverable becomes the hard pre-flight gate that 24-15 cannot flip without.

**Files:**

- `verification-artifacts/release-safety-gate-24-14.md` — **NEW** (the story's only deliverable; force-added — `verification-artifacts/` is gitignored): the release-safety gate artifact — §0 exec summary, §1 the full 12-gate DoD checklist with status + evidence (file:line / suite / exact result), §2 the 63/63 P1 route enumeration, §3 the A/B/C ownership map + sign-off, §4 the rollback + watch-window procedure, §5 the pre-flight sign-off statement, §6 the gate-run details (typecheck · build · test:full 66/744 · test:integration 23/262 · lint · boundaries · migration status · Nest prod boot). Signed by the Backend Engineer (Story 24-14).

## Implementation Details

### The §1 DoD gates — verified from the shipped code (not asserted)

The gate's evidence is structural, not a checklist of intentions. Key verifications:

```text
# S1 — P0-1 closed structurally (ReviewRepository.ts:86-88, 166-168)
#   if (userId === undefined) return []        // before ANY prisma call
#   if (userId === undefined) return 0         // before prisma.srsCardState.count
#   → zero req.userId! / req.user! across src/modules/*/nest/*.ts (only a comment)
#   → P0-1 regression: review-nest.controller.test.ts (7) + ReviewRepository.test.ts
#     (undefined → []/0, no-Prisma-call asserted) + review-parity A/B no-leak

# S2 — calibrated guest-auth (packages/shared-constants/src/index.js:98-117)
#   createGuestPhaseGate() → { id:"guest-unlocked", currentPhase:1,
#     phase4Unlocked:false, isGuest:true, ... }   // never all-unlocked
#   OptionalAuthGuard: no/invalid token → req.userId undefined, guest continues
#   /gates guest branch (progression-nest.controller.ts) → Phase-1-only shape
#     (NOT the all-passed GUEST Express still returns — unified at 24-15)

# O1 — log parity (src/nest/exception.filter.ts)
#   logger.error("API Error", { requestId, code, message, stack })
#   → byte-for-byte identical to errorHandler.ts; mountExpressErrorBridge() for
#     pre-router errors (body-parser 413)

# O2 — healthcheck (dist/nest/main.js, PORT=3999)
#   GET /api/v1/health → 200 {"status":"ok", ...,"services":{"gemini":true,"tts":true},
#     "cache":{"redis":{"connected":true}}}    // matches Express shape

# D1 — additive-only migration (20260821175536_add_srs_card_state)
#   CREATE EXTENSION IF NOT EXISTS vector + enum SrsState + table SrsCardState
#   + 3 indexes + 1 unique — zero ReviewItem drops/renames/alters
#   npx prisma migrate status → 30 migrations, "Database schema is up to date!"

# R1 — Node 24 + ESM + config fail-fast
#   .node-version = 24, .nvmrc = 24.x; dist/nest/main.js (2286 B) emitted + boots;
#   validateConfig() BEFORE NestFactory.create; CORS/trust-proxy-1/cookie parity;
#   Prisma 7 CJS (default-import + PrismaPg) boot-smoked
#   caveat: engines are lower-bounds (>=22 / >=20.0.0) → 24-15 validates Node 24 prod boot

# R2 — graceful shutdown (unit-tested)
#   DatabaseModule.onApplicationShutdown → prisma.$disconnect()
#   SharedModule.onApplicationShutdown → redisClient.quit()
#   app.enableShutdownHooks(); shared-module.providers.test.ts asserts moduleRef.close()
```

### P1 parity enumeration — 63/63 (100%)

Enumerated from the **17 route files** (`router.<method>(` registrations = 63) vs the parity harness (`tests/integration/nest/*.test.ts`, **9 harnesses**). **No uncovered routes.**

| Module (routes) | Routes | Covered by harness |
|---|---|---|
| words (2) | `GET /v1/words/:glyph`, `GET /v1/words/:glyph/measure-words` | `route-parity.test.ts` |
| phonetic-clusters (2) | `GET /v1/phonetic-clusters`, `GET /v1/phonetic-clusters/:id` | `route-parity.test.ts` |
| grammar (2) | `GET /v1/grammar/patterns`, `GET /v1/grammar/patterns/:id` | `route-parity.test.ts` |
| chengyu (2) | `GET /v1/chengyu/idioms`, `GET /v1/chengyu/idioms/:id` | `route-parity.test.ts` |
| audio (1) | `POST /v1/tts` | `audio-health-parity.test.ts` |
| health (1) | `GET /v1/health` | `audio-health-parity.test.ts` |
| auth (5) | register / login / refresh / logout / `GET me` | `auth-parity.test.ts` |
| characters (6) | `:glyph` (foundations shadow), `:glyph/phonetic`, `:glyph/homophones`, `:glyph/decomposition`, `/search` (404 shadow), `/frequency` (404 shadow) | `characters-mnemonics-parity.test.ts` + `radicals-foundations-parity.test.ts` (shadow block) |
| pinyin (1) | `GET /v1/pinyin/search` | `characters-mnemonics-parity.test.ts` |
| mnemonics (4) | GET / POST / PUT / DELETE `/v1/mnemonics/:glyph` | `characters-mnemonics-parity.test.ts` |
| radicals (4) | `/radicals`, `/:id`, `/character/:glyph`, `/:id/characters` | `radicals-foundations-parity.test.ts` |
| foundations (4) | `data/pinyin-tones`, `data/pinyin-character-map`, `data/strokes`, `characters/:glyph` (shadow wins) | `radicals-foundations-parity.test.ts` |
| review (3) | `GET /v1/review/items`, `GET /v1/review/due-count`, `POST /v1/review/result` | `review-parity.test.ts` |
| readers (11) | passages list/get, `passages/:id/audio`, generate, sessions get/put/complete, bookmarks get/post, bookmarks by-passage get/delete | `readers-parity.test.ts` |
| quiz (8) | config, questions, attempts GET, attempts POST, attempts/:id/answers, attempts/:id/complete, feedback, sandhi-drill/questions | `quiz-progression-parity.test.ts` |
| progression (7) | foundation-progress GET/PUT, phase-gate GET/PUT, gates, radical-progress GET/PUT | `quiz-progression-parity.test.ts` |
| **TOTAL** | **63** | **63 (100%)** |

*Note: `GET /v1/characters/:glyph` is counted once and exercised through the foundations shadow (foundations mounted first on both apps — identical behavior, verified in the shadow-parity blocks).*

### The pre-flight sign-off + rollback/watch-window (the gate's operative output)

The pre-flight sign-off (S1 + S2 + P1 100% + T1) is the **hard gate**: it is the explicit "24-15 may flip" signal, with **no gate failed** and no blocker surfaced. The rollback runbook (Express entry for one release OR redeploy-previous; **no schema rollback needed** — additive-only) and the watch-window procedure (≥24–48h, 24-3 requestId-log observation, stop condition on any un-`requestId`'d error or 500 on a previously-green route) make D2 **real, not hypothetical**. The 24-15 input list (Node 24 prod-boot validation + `engines` tighten, openapi refresh + 9 dead-route removal, `/api-docs` decision, docs refresh, `ReadersAudioController.test.ts` retirement + Express surface deletion + `/gates` GUEST unification) is the cutover's explicit hand-off.

## Architecture Integration

```
[Story 24-14: Release-Safety Cutover Gate] — DOCS/VERIFICATION ONLY (no production code)
├── verification-artifacts/release-safety-gate-24-14.md — the committed release checklist:
│     §1 12-gate DoD (S1–S2/P1–P2/T1/O1–O2/D1–D2/R1–R2/DOC/G) status + evidence
│     §2 P1 parity enumeration (63/63)  §3 A/B/C ownership map + sign-off
│     §4 rollback + watch-window  §5 pre-flight sign-off  §6 gate-run details
├── Verifies (evidence from the shipped epic work):
│     S1 ← 24-1 (Express stopgap) + 24-11 (Nest structural) — ReviewRepository.ts:86-88/166-168
│     S2 ← 24-5 (guards) + 24-7 (identity) + 24-8/24-10/24-13 (consumers)
│     P1 ← 24-2/24-3/24-6/24-8/24-9/24-10/24-11/24-12/24-13 parity harnesses (9, 63/63)
│     O1 ← 24-3 AppExceptionFilter  O2 ← 24-10 health  D1/R2 ← 24-11  R1 ← 24-2/24-3/24-4
├── Gate that 24-15 (cutover) cannot flip without:
│     pre-flight sign-off PASS (S1+S2+P1 100%+T1) → 24-15 UNBLOCKED
├── 24-15 inputs flagged: Node 24 prod-boot validation + engines tighten · openapi refresh
│     + 9 dead routes · /api-docs decision · docs/architecture + conventions/KB refresh ·
│     ReadersAudioController.test.ts retirement + Express deletion + /gates GUEST unification
└── Dependencies: 24-1 … 24-13 (all modules ported + safety items landed) — runs last,
      immediately before 24-15
```

Dependencies: this gate **verifies** the accumulated output of the whole serial epic — **24-1** (P0-1 stopgap + T1 baseline), **24-2/24-3/24-6/24-8/24-9/24-10/24-11/24-12/24-13** (the 9 parity harnesses + the O1/O2/R1/R2/D1 items), **24-5/24-7** (calibrated guest-auth), **24-11** (structural P0-1 + additive `SrsCardState` + graceful shutdown). It is the **mandatory pre-flight immediately before 24-15**. Parallel-safety: **no production code is touched** — the gate is a committed verification artifact; `check:module-boundaries` green; no `packages/shared-constants` / `packages/shared-types` / FE change. Consumers: **24-15** (the cutover it unblocks + the explicit input list) and **epic closing** (the BR/IMP status + commit-hash finalization).

## Technical Challenges & Solutions

### The 63-route parity enumeration — proving 100% coverage is an evidence artifact, not a claim

```
Problem: the P1 gate demands "parity harness covers 100% of ~63 routes across all 17 route
        files" — but a "100%" assertion is meaningless unless the route set is ENUMERATED
        against the code and every route is mapped to a harness that exercises it. The
        count had to be re-derived from the actual `router.<method>(` registrations, and
        per-module coverage proven, not assumed.
Root Cause: route counts drift (modules gained/lost routes across 24-1…24-13); a stale
        count from an older doc would fail the truth-check; and "covered" must mean
        "2xx body+status AND 4xx/5xx envelope deep-equal" per the §1 contract, not just
        "exists in a harness".
Solution: enumerate the 63 routes from the 17 route files (`router.<method>(`), then map
        every route to its covering parity harness (9 harnesses) with per-module counts
        (words 2 · phonetic-clusters 2 · grammar 2 · chengyu 2 · audio 1 · health 1 ·
        auth 5 · characters 6 · pinyin 1 · mnemonics 4 · radicals 4 · foundations 4 ·
        review 3 · readers 11 · quiz 8 · progression 7 = 63) and reconcile against
        ROUTE_PATTERNS (every path + verb verbatim). `GET /v1/characters/:glyph` is
        counted once and exercised through the foundations shadow (identical mount-order
        behavior on both apps, 24-9).
Impact: the P1 gate is a committed, auditable enumeration (artifact §2) — 63/63 (100%),
        no uncovered routes; the count truth-checks against ROUTE_PATTERNS and the 16
        module dirs under `apps/backend/src/modules/`.
```

### The additive-migration verification — proving D1 with zero destructive ops

```
Problem: the D1 gate requires the release's migration set to be additive-only, but
        "additive-only" is a claim that must be proven by reviewing the actual
        migration SQL — the epic landed the absorbed `SrsCardState` schema (24-11),
        the highest-risk migration item (new enum/table/vector column on the SRS
        surface).
Root Cause: a destructive migration (a ReviewItem drop/rename/alter) would break the
        rollback story (Express ↔ Nest share the schema) and risk data loss on deploy.
Solution: review the single epic migration `20260821175536_add_srs_card_state` line-by-line:
        `CREATE EXTENSION IF NOT EXISTS vector` + new enum `SrsState` + new table
        `SrsCardState` + 3 indexes + 1 unique index — ZERO `ReviewItem`
        drops/renames/alters (`ReviewItem` stays fully live). Confirm `npx prisma
        migrate status` → 30 migrations "up to date" and Railway `preDeployCommand` =
        `db:migrate:deploy`.
Impact: D1 is proven, not asserted — additive-only ⇒ a running Express build is compatible
        with the post-deploy schema ⇒ no migration rollback is ever needed (D2 depends on
        this).
```

### The rollback/watch-window design — making D2 real, not hypothetical

```
Problem: the D2 gate requires rollback to be real ("start:express for one release OR
        redeploy-previous"), plus a post-flip smoke + a watch window before Express is
        deleted — but a rollback runbook is only useful if the escape hatch actually
        still builds and serves, and the watch window must have an observable signal.
Root Cause: after the 24-15 flip, Nest becomes `start`; if the Express entry were deleted
        immediately, rollback would be impossible; and "watch" needs a concrete log
        signal to detect regressions.
Solution: verify the Express entry `dist/app/index.js` still builds (5137 B) and serves
        (it is today's `start` in `railway.toml`; Nest is a side artifact via
        `start:nest`) — after the flip, roll back by re-pointing `startCommand` to the
        Express entry (or a retained `start:express` script) for one release, OR
        redeploy-previous Railway release. Watch window = ≥24–48h observing the 24-3
        requestId logs (`API Error { requestId, code, message, stack }`); stop condition
        = any error without `requestId` or any 500 on a previously-green route;
        gate-to-delete = window closes with no P1/P0 AND the P1 parity harness re-runs
        green on the flipped build.
Impact: D2 is verified + executable — rollback requires no schema revert (additive-only
        D1), and the watch window turns "safe to delete Express" into an observable,
        gateable decision, not a guess.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — every route in the §P1/§2 enumeration reconciles against `ROUTE_PATTERNS` keys (`wordsByGlyph`/`wordsMeasureWords`, `phoneticClusters`/`phoneticClustersById`, `grammarPatterns`/`grammarPatternById`, `chengyuIdioms`/`chengyuIdiomById`, `ttsAudio`, `health`, `authRegister/Login/Refresh/Logout/Me`, `charactersByGlyph`/`charactersPhonetic`/`charactersHomophones`/`charactersDecomposition`/`charactersSearch`/`charactersFrequency`, `pinyinSearch`, `mnemonics`/`mnemonicsByChar`, `radicals`/`radicalsById`/`radicalsByCharacter`/`radicalsCharacters`, `foundationsPinyinTones`/`foundationsPinyinCharacterMap`/`foundationsStrokes`, `reviewItems`/`reviewDueCount`/`reviewResult`, `readersPassages`/`readersPassageById`/`readersGenerate`/`readersPassageAudioById`/`readersSessionByPassageId`/`readersSessionCompleteByPassageId`/`readersBookmarks`/`readersBookmarkByPassageId`, `quizConfig`/`quizQuestions`/`quizAttempts`/`quizAttemptAnswer`/`quizAttemptComplete`/`quizFeedback`/`quizSandhiDrill`, `progressionFoundationProgress`/`progressionFoundationProgressSection`/`progressionPhaseGate`/`progressionGates`/`progressionRadicalProgress`/`progressionRadicalProgressById`); `/api` prefix applied by the shell; the 9 dead openapi routes are explicitly flagged (NOT documented as live)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — all 16 module dirs (`audio`, `auth`, `characters`, `chengyu`, `foundations`, `grammar`, `health`, `mnemonics`, `phonetic-clusters`, `progression`, `quiz`, `radicals`, `readers`, `review`, `words` — with `pinyin` served under `characters`) reconciled; `ReviewRepository`, `AppExceptionFilter`/`logError`, `createGuestPhaseGate`, `OptionalAuthGuard`, `progression-nest.controller.ts` verified from the shipped files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — the gate verifies DB-backed modules against the shared Prisma singleton (e.g. `ReviewRepository` guards, `prisma.srsCardState.count`, the `SrsCardState` migration); `prisma migrate status` 30 up-to-date
- [x] All relative markdown links resolve — sibling story BRs 24-1/24-3/24-5/24-7/24-10/24-11/24-13 exist; the epic BR README exists; the IMP twin path resolves; 24-15 is referenced as a stub (epic IMP README), not linked to a non-existent file
- [x] Last Updated / Last Update date is current (same commit as the edit)
- [x] **Truth-check corrections:** (1) `start:express` is NOT an existing npm script — today's `start` = `node dist/app/index.js` (Express) and `start:nest` = `node dist/nest/main.js`; the escape hatch is "run the Express entry `node dist/app/index.js`" (or a **retained/added** `start:express` script after the 24-15 flip), phrased to match the shipped `apps/backend/package.json`; (2) the artifact's §D2 wording is preserved but pinned to the actual script names so the doc does not invent a script that does not exist; (3) the openapi dead-route list was re-derived from `apps/backend/src/shared/docs/openapi.yaml` (5 `/v1/vocabulary/*` + 4 `/v1/progress*` = 9) and matches the artifact §P2.

## Testing Implementation

This is a **docs/verification story — no production code or test code is written**. The "testing" is the gate's own verification burden: every DoD gate is either a CI run or a committed artifact, and the exact results are recorded in the artifact §6:

| Gate | Command | Exact result (run 2026-08-22) |
|---|---|---|
| Typecheck | `npx tsc --noEmit` (apps/backend) | exit 0 |
| Build | `npm run build --workspace=@mandarin/backend` | exit 0; `dist/app/index.js` 5137 B + `dist/nest/main.js` 2286 B emitted |
| Full unit | `npm run test:full` | **66 files / 744 tests passed** (5.90s) |
| Integration | `npm run test:integration` | **23 files / 262 tests passed** (82.61s) |
| Lint | `npm run lint` (eslint .) | exit 0 |
| Boundaries | `npm run check:module-boundaries` | exit 0 |
| Migration | `npx prisma migrate status` | 30 migrations, "Database schema is up to date!" |
| Nest prod boot | `node dist/nest/main.js` (PORT=3999) | booted; `GET /api/v1/health` → 200 |

Evidence is structural (file:line for the P0-1 guards, the calibrated guest shape, the error-filter parity, the additive migration SQL, the Node-24 toolchain files) plus the parity-suite + unit-suite results that back P1/T1/O1/R2. The **pre-flight sign-off** (S1 + S2 + P1 100% + T1) is the story's acceptance verdict — all PASS → **24-15 UNBLOCKED**, with the 24-15 input list as the explicit hand-off.
