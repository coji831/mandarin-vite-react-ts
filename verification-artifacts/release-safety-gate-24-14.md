# Story 24-14 — Release-Safety Cutover Gate: DoD Verification + Pre-Flight Sign-Off

**Date:** August 22, 2026
**Branch:** `epic-24-nestjs-shell-migration`
**Story:** 24-14 (stub in [epic README](../../docs/issue-implementation/epic-24-nestjs-shell-migration/README.md))
**Source of truth:** Architect's release-safety scope report §1 (DoD gates) + §4 (release checklist).
*Note: the Architect report used the pre-serial-renumber numbering (gate=24-13, cutover=24-12); under the serial renumber these are **24-14 = gate** and **24-15 = cutover**. All gate semantics below are the report's, mapped to the current numbers.*
**Verified by:** Backend Engineer (Story 24-14) — every line below was run/read, not assumed.

---

## 0. Executive Summary

The fully-migrated NestJS shell is **release-safe per the §1 Definition of Done**. All twelve DoD gates are **PASS**. The pre-flight sign-off block (S1 + S2 + P1 + T1) is green, so **the 24-15 cutover is UNBLOCKED**.

- **S1 Security (P0-1):** ✅ structurally closed — repository rejects `undefined` userId before Prisma; zero `req.userId!` in Nest controllers; P0-1 regression tests green.
- **S2 Security (guest-auth):** ✅ calibrated shape end-to-end (`createGuestPhaseGate → {currentPhase:1, isGuest:true}`, `OptionalAuthGuard` guest → empty, `/gates` guest = Phase-1-only).
- **P1 Parity:** ✅ 63/63 routes covered by the parity harness (100%), all integration parity green.
- **P2 Parity (dead/misrouted):** ✅ route-set reconciled; the openapi dead-doc diff is understood and handed to 24-15.
- **T1 Tests:** ✅ `test:full` **66 files / 744 tests**, `test:integration` **23 files / 262 tests** — all green.
- **O1/O2 Ops:** ✅ every 4xx/5xx logged with `requestId` (24-3 filter); `/api/v1/health` green from the Nest prod build.
- **D1/D2 Deploy:** ✅ migration set additive-only (single 24-11 `SrsCardState` migration, zero destructive ops, `migrate status` 30 up-to-date); rollback runbook verified.
- **R1/R2 Runtime:** ✅ Node 24 declared (`.node-version`/`.nvmrc`), ESM prod build boots, `validateConfig()` fail-fast, CORS/trust-proxy/cookie parity, graceful shutdown wired + unit-tested.
- **DOC:** input state flagged (openapi + architecture docs refresh is 24-15's scope).
- **G Quality:** ✅ build · lint 0 · typecheck · test · test:full · test:integration · check:module-boundaries all green.

**No gate FAILED. No 24-15 blocker surfaced by this gate.** (A small R1 caveat on `engines` being lower-bounds is recorded in §R1 and is a hardening note, not a blocker.)

---

## 1. DoD Gate Checklist

### S1 Security — P0-1 closed structurally ✅ PASS

| Check | Evidence |
|---|---|
| `ReviewRepository.findByUserAndTypes` rejects `undefined` userId before Prisma | `src/modules/review/repositories/ReviewRepository.ts:86-88` — `if (userId === undefined) return []` **before** any `prisma` call (no ignore-`undefined` path) |
| `ReviewRepository.countDue` rejects `undefined` before Prisma | `ReviewRepository.ts:166-168` — `if (userId === undefined) return 0` before `prisma.srsCardState.count` |
| No `req.userId!` non-null assertion in Nest controllers | Code-scan across `src/modules/*/nest/*.ts` — **zero** `req.userId!`/`req.user!`; the only hit is a *comment* (`progression-nest.controller.ts:209`). Ported controllers use `req.userId as string` (typed) + a defensive `if (!userId) 401` mirroring Express |
| P0-1 regression tests green | `review-nest.controller.test.ts` (7 tests: each route "throws 401 and never calls the service when req.userId is missing") + `ReviewRepository.test.ts` (`undefined → []`/`0`, **no Prisma call** asserted) — included in `test:full` 744 ✅ |
| Guest ⇒ 401/empty, never another user's rows | `review-parity.test.ts` — "P0-1 no-leak (user B never sees user A's rows)" + guest-401 A/B parity ✅ (in integration 262) |

**Owner:** absorbed in-epic (24-1 stopgap + 24-11 structural). **Status:** closed on both the Express and Nest paths.

### S2 Security — guest-auth == calibrated shape ✅ PASS

| Check | Evidence |
|---|---|
| `createGuestPhaseGate → {currentPhase:1, isGuest:true}` | `packages/shared-constants/src/index.js:98-117` — returns `{ id:"guest-unlocked", currentPhase:1, phase4Unlocked:false, isGuest:true, ... }` (never all-unlocked) |
| `OptionalAuthGuard` guest → undefined/empty (never all-unlocked) | `src/nest/guards/optional-auth.guard.ts` — no token → `return true` with `req.userId` undefined; invalid/expired token → caught, guest continues (never 401/403, never a fabricated user) |
| `/gates` guest branch calibrated | `src/modules/progression/nest/progression-nest.controller.ts` `getGates` — guest → `{ phase2Gate:{passed:false,reason:"GUEST"}, characterCountGate:{passed:false,...}, phase3To4Gate:{passed:false,...} }` (Phase-1-only, NOT the all-passed GUEST shape Express still returns — Express unified at 24-15) |
| `getPhaseGate` guest → calibrated gate | `progression-nest.controller.ts` — guest → `createGuestPhaseGate()` |
| Guest-behavior tests / parity green | `auth-guards-parity.test.ts` (hermetic: required/require 401, optional guest passes with null user) + `quiz-progression-parity.test.ts` (calibrated `/gates` guest, guest progression `[]`) + `audio-health-parity.test.ts` (guest TTS never 401, F5) — all in the green suites below |

**Owner:** absorbed in-epic (24-5 guards, 24-7 identity calibration, 24-8/24-10/24-13 consumers). **Status:** calibrated shape reproduced on the Nest surface.

### P1 Parity — 100% route coverage ✅ PASS

- **Total registered Express routes: 63** across **17 route files** (enumerated from `router.<method>(` registrations).
- **Covered by the parity harness: 63/63 (100%).** Full enumeration in §2.
- Integration parity suites all green (262 tests) — 2xx status **and** body deep-equal, 4xx/5xx status + `{code,message,requestId}` envelope.
- **No uncovered routes.**

### P2 Parity — no dead/misrouted endpoints ✅ PASS (diff → 24-15)

- **Express registry = ROUTE_PATTERNS = Nest registry:** all 63 routes ported; no Express route left unported/unreachable on Nest (P1 100%).
- **Route-shadowing reproduced:** `GET /v1/characters/:glyph` (foundations wins, matching Express mount order) is byte-for-byte identical on Nest (24-9), including `/search` + `/frequency` → 404. Documented in 24-8/24-9.
- **openapi.yaml is STALE (dead docs) — input to 24-15:** documents `/v1/vocabulary/lists`, `/v1/vocabulary/lists/{listId}`, `/v1/vocabulary/lists/{listId}/progress`, `/v1/vocabulary/lists/{listId}/words`, `/v1/vocabulary/search`, `/v1/progress`, `/v1/progress/{wordId}`, `/v1/progress/batch`, `/v1/progress/stats` — **none** exist in ROUTE_PATTERNS or the Express registry. Per the story scope, **openapi refresh is 24-15's responsibility**; this gate records the diff as its input. These are removed endpoints, not new/misrouted ones.
- `/api-docs` + `/api-docs.json` (swagger-ui-express) remain mounted on Express today; the serve-from-Nest-or-remove decision is 24-15's (O2).

### T1 Tests ✅ PASS

| Suite | Result (exact) |
|---|---|
| `npm run test:full` (`vitest run`) | ✅ **66 files / 744 tests passed** (exit 0) |
| `npm run test:integration` (`vitest --config vitest.integration.config.ts`) | ✅ **23 files / 262 tests passed** (exit 0) |

- **Stale artifact note:** `modules/readers/api/__tests__/ReadersAudioController.test.ts` **still present and passing** — it uniquely covers the live Express `ReadersController.getPassageAudio` until Express is deleted. **Retires at 24-15** (per 24-11/24-12 investigation; removal now would drop live coverage).
- Nest-side coverage for ported controllers: controller unit tests + the parity harness (e2e-style, boots both apps) serve as the Nest e2e per story ACs.

### O1 Ops — error visibility ✅ PASS

- `src/nest/exception.filter.ts` `logError()` → `logger.error("API Error", { requestId, code, message, stack })` — byte-for-byte identical to `errorHandler.ts` (O1 parity). Every 4xx/5xx through the Nest filter logs with `requestId`.
- `mountExpressErrorBridge()` (mounted last) catches pre-router errors (body-parser 413) with the same envelope + log.
- Log-parity asserted in the harness (oversized-body 413, seeded 429/500).

### O2 Ops — healthcheck ✅ PASS

- **`/api/v1/health` green from the Nest shell:** booted the production entry `dist/nest/main.js` (PORT=3999) → `GET /api/v1/health` → **200** `{"status":"ok","timestamp":...,"uptime":...,"services":{"gemini":true,"tts":true},"cache":{"redis":{"connected":true}}}` (shape matches Express; parity also asserted in `audio-health-parity.test.ts`).
- Railway `healthcheckPath` is already `/api/v1/health` (`railway.toml`).
- `/api-docs` + `/api-docs.json`: still served by Express today → **input to 24-15** (serve from Nest or document removal).

### D1 Deploy — migration additive-only ✅ PASS

- **Single migration added by the epic:** `20260821175536_add_srs_card_state` (24-11). Reviewed `migration.sql`: `CREATE EXTENSION IF NOT EXISTS vector` + new enum `SrsState` + new table `SrsCardState` + 3 indexes + 1 unique index. **Zero** `ReviewItem` drops/renames/alters — `ReviewItem` stays fully live. Additive-only ✅.
- `npx prisma migrate status` → **30 migrations found, "Database schema is up to date!"** (clean).
- Railway `preDeployCommand` = `npm run db:migrate:deploy` — runs the additive set before start.

### D2 Deploy — rollback runbook ✅ PASS (procedure in §4)

- **`start:express` escape hatch verified:** the Express entry `dist/app/index.js` still builds (✅ build emits it, 5137 bytes) and still serves (it remains today's `start` = `node dist/app/index.js` in `railway.toml`). Nest is a side artifact (`dist/nest/main.js`, `start:nest`). After the 24-15 flip, the escape hatch is running `node dist/app/index.js` (or a retained `start:express` script) — see §4.
- Alternative rollback: **redeploy previous Railway release** (one click in Railway).
- Post-flip smoke + watch-window procedure documented in §4.

### R1 Runtime — Node 24 + ESM prod build + config fail-fast ✅ PASS (one caveat)

| Check | Evidence |
|---|---|
| Node 24 declared | `apps/backend/.node-version` = **24**, `apps/backend/.nvmrc` = **24.x** ✅ |
| ESM prod build emits Nest entry | `npm run build` → `dist/nest/main.js` (2286 bytes) + `dist/app/index.js` (5137 bytes) emitted; backend `"type":"module"` ✅ |
| Prod build boots | `node dist/nest/main.js` booted → health 200 (Redis connected, DB reachable) ✅ |
| `validateConfig()` fail-fast on Nest boot | `src/nest/main.ts` calls `validateConfig()` **before** `NestFactory.create`; `src/shared/config/index.ts:150` throws `[Config] <key> is required but not set` ✅ |
| CORS / `trust proxy 1` / cookie parity | `src/nest/configure-app.ts` — identical origin allowlist, `set("trust proxy", 1)`, `cookieParser()`, `express.json()`/`urlencoded` with same limits ✅ |
| Prisma 7 CJS pattern in prod | `DatabaseModule` — CJS default-import + `PrismaPg` connection-string adapter; boot smoke passed ✅ |

**Caveat (hardening note, NOT a blocker):** the `engines` fields are **lower bounds**, not pins — backend `"node": ">=22"`, root `"node": ">=20.0.0"` — satisfied by Node 24 but not pinning it. The toolchain files (`.node-version: 24`, `.nvmrc: 24.x`) declare 24, and the local dev shell is on Node v20.19.4. **24-15 must validate the prod boot under Node 24 on Railway** (RAILPACK respects `.nvmrc`/`.node-version`) and may tighten `engines` to `>=24`.

### R2 Runtime — graceful shutdown ✅ PASS

- `DatabaseModule.onApplicationShutdown` → `this.prisma.$disconnect()` (`src/nest/shared/database.module.ts`).
- `SharedModule.onApplicationShutdown` → `redisClient.quit()` (`src/nest/shared/shared.module.ts`).
- `app.enableShutdownHooks()` in `configure-app.ts` (both modules' hooks fire on SIGTERM).
- Unit-tested: `shared-module.providers.test.ts` — `moduleRef.close()` triggers `onApplicationShutdown` (Prisma disconnect + Redis quit) ✅ (in test:full 744).

### DOC — input state flagged ✅ (refresh is 24-15)

Per the story scope, DOC is NOT closed here — it is **flagged as 24-15's work**:
- `apps/backend/src/shared/docs/openapi.yaml` — **stale** (dead `/v1/vocabulary/*` + `/v1/progress*` docs, §P2); regenerate + reconcile at 24-15.
- `docs/architecture.md`, `module-level-containers.md`, backend conventions — not yet updated for the Nest surface; 24-15 truth-check.
- `/api-docs` consumer decision — 24-15.
- Epic BR/IMP closing — at epic close.

### G Quality — canonical gates ✅ PASS

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (apps/backend) | ✅ exit 0 |
| `npm run build --workspace=@mandarin/backend` | ✅ exit 0 (both dist entries emit) |
| `npm run lint` (eslint .) | ✅ exit 0 (0 errors) |
| `npm test` (changed scope) | covered by test:full below (no changed test files in this story) |
| `npm run test:full` | ✅ 66 files / 744 tests |
| `npm run test:integration` | ✅ 23 files / 262 tests |
| `npm run check:module-boundaries` | ✅ exit 0 ("All shared imports respect the direction rule; naming guard clean") |

---

## 2. P1 Parity Coverage — 63/63 routes

Enumerated from the 17 route files (`router.<method>(` registrations = 63) vs the parity harness (`tests/integration/nest/*.test.ts`). **No uncovered routes.**

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

---

## 3. A/B/C Ownership Map — status

Per Architect scope report §2 (verdict keys A = absorb into Epic 24, B = hard prereq, C = post-release-safe). Under the serial plan, Epic 24 ran first-to-completion and absorbed the release-safety scope, so the original B enforcement became in-epic work. **All absorbed items landed; C items declared.**

| Item | Verdict | Status in Epic 24 |
|---|---|---|
| 2.1 P0-1 leak (`findByUserAndTypes`/`countDue` undefined; `req.userId!`) | B→absorbed | ✅ **Landed** — 24-1 stopgap (Express) + 24-11 structural (Nest repo guard + typed controller) + regression tests (§S1) |
| 2.2 Guest identity / auth semantics (F1–F6, `createGuestPhaseGate`) | B→absorbed | ✅ **Landed** — 24-5 guards (calibrated), 24-7 identity calibration, 24-8/24-10/24-13 consumers (§S2) |
| 2.3 Quiz-engine known bugs (`PHASE_CONFIGS[3]`, aggregation, key-4 dup) | B→**C-declared** | 🟡 **C-declared → epic-26** — the FE quiz fixes (`useQuizCard`, `QuizCard`, strategy registry) stay in epic-26; the **backend engine was ported correctly** (no backend bug canonized, 24-13). Not a migration regression; does not block the Nest cutover |
| 2.4 Gate/phase data + HSK rebase | C | 🟡 **C-declared → epic-27** (status-quo data is what's live; not release-blocking) |
| 2.5 Review/SRS schema (`SrsCardState`, reserved vector) | B→absorbed | ✅ **Landed additive-only** — 24-11 schema + migration (§D1) |
| 2.6 openapi.yaml refresh | A | 🟡 In progress — refresh + reconciliation is **24-15** (§P2/DOC) |
| 2.7 Full ~63-route parity harness | A | ✅ **Landed** — 63/63 (§P1) |
| 2.8 Test baseline + integration coverage | A | ✅ **Landed** — baseline recorded in `test-report-24-1.md`; suites green (§T1) |
| 2.9 Observability minimum (error visibility + healthcheck) | A | ✅ **Landed** — 24-3 filter (§O1) + health (§O2) |
| 2.10 Full observability spine | C | 🟡 **C-declared → epic-39** (parity = no regression; not release-blocking) |
| 2.11 Rate limiting | A | ✅ **Landed** — 24-2/24-3 infra, 24-6 auth brute-force, 24-12 readers 5/day, 24-13 quiz feedback |
| 2.12 Error envelope + requestId + body-parser | A | ✅ **Landed** — 24-3 (§O1) |
| 2.13 Deployment safety (rollback/smoke/watch) | A | ✅ **Landed (documented here)** — §4 |
| 2.14 Config/secrets/runtime (Node 24, CORS/trust-proxy, Prisma CJS) | A | ✅ **Landed** — §R1 |
| 2.15 Graceful shutdown | A | ✅ **Landed** — 24-3/24-4 (§R2) |
| 2.16 Prisma migration safety at cutover | A (+B schema) | ✅ **Landed** — §D1 |
| 2.17 Swagger/SDK consumer surface | A | 🟡 In progress — **24-15** (serve from Nest or document removal) |
| 2.18 Dead/misrouted endpoints | A | 🟡 In progress — diff documented (§P2); openapi cleanup is **24-15** |
| 2.19 Stale `ReadersAudioController.test.ts`; `WordsRoutes.ts` uppercase; config homes; `GcsFileStore` DI | A | ✅ **Landed** — WordsRoutes covered in harness (24-2); config homes → Nest providers (24-4); `GcsFileStore` lazy-singleton DI (24-4); stale test **kept + deferred to 24-15** (uniquely covers live Express method) |
| 2.20 Cosmetic housekeeping | C | 🟡 **C-declared** (non-blocking) |

**Sign-off:** the A/B/C ownership map above reflects the state at 24-14. The only items still open are the **24-15-scoped** A-items (openapi/docs/`/api-docs` — all recorded as 24-15 inputs) and the **C-declared** items (epic-26 quiz-FE fixes, epic-27 data, epic-39 observability spine, cosmetic).

---

## 4. Rollback + Watch-Window Procedure

### 4.1 Rollback runbook (verified)

**Primary — `start:express` escape hatch (keep for one release):**
- The Express production entry `node dist/app/index.js` **still builds and serves** (verified: `npm run build` emits it; it is today's `start` command in `railway.toml`).
- **After the 24-15 flip** (Nest becomes `start`): to roll back, either (a) revert `railway.toml` `startCommand` to run the Express entry (`node dist/app/index.js`), or (b) re-point the start script. The Express entry remains compilable until it is explicitly deleted (24-15's retirement ACs).
- Because Nest and Express share the same Prisma client + schema, **no migration rollback is needed** — the release's migration set is additive-only (§D1), so a running Express build is compatible with the post-deploy schema.

**Secondary — redeploy previous Railway release:** Railway keeps prior releases; redeploy the last known-good release (one click) as the simplest fallback. Both options restore service without a schema rollback.

### 4.2 Post-flip smoke (on Railway, immediately after 24-15 flips)

1. `GET /api/v1/health` → 200 `{"status":"ok", ...}` (healthcheckPath).
2. `POST /api/v1/auth/register` → 201 + `set-cookie` httpOnly refresh token.
3. `POST /api/v1/auth/login` → 200 + access token.
4. One **authenticated data route** → 200 (e.g. `GET /api/v1/review/due-count` or `GET /api/v1/readers/passages` with the Bearer token), and one **guest** route → calibrated guest shape (e.g. `GET /api/v1/progression/phase-gate` → `currentPhase:1, isGuest:true`).
5. Confirm a 4xx produces the `{code, message, requestId}` envelope and appears in logs.

### 4.3 Watch window (before Express deletion)

- **Duration:** run for a full business cycle after the flip — recommended **≥ 24–48 hours** (long enough to cover a full day of real traffic; extend if any P1 issue is observed).
- **What to observe (via the 24-3 requestId logs):** scan the backend logs for `API Error { requestId, code, message, stack }` lines. Every 4xx/5xx must carry a `requestId`; correlate spikes in `5xx` / `INTERNAL_ERROR` codes. Any error that does **not** include `requestId`, or any 500 on a previously-green route, is a watch-window stop condition — escalate before deleting Express.
- **Gate to delete Express:** only after the watch window closes with no P1/P0 regression AND the P1 parity harness is re-run green on the flipped build.

---

## 5. Pre-Flight Sign-Off Statement

**Date:** August 22, 2026

I verify that the following DoD pre-flight gates are **PASS**:

- **S1 (P0-1 closed structurally + regression green):** ✅ PASS
- **S2 (guest-auth == calibrated shape):** ✅ PASS
- **P1 (parity harness 100% route coverage — 63/63):** ✅ PASS
- **T1 (`test:full` 744 + `test:integration` 262 green):** ✅ PASS

→ **The 24-15 cutover is UNBLOCKED.**

No gate failed; no blocker exists at 24-14. Remaining open items are **24-15's declared scope** (openapi refresh + reconciliation, `/api-docs` decision, docs refresh/truth-check, Express retirement, stale-test removal, Node-24 prod-boot validation on Railway, optional `engines` tightening) and the **C-declared** items (§3). These do not block the flip but are recorded as 24-15 inputs.

**Signed:** Backend Engineer (Story 24-14)

---

## 6. Gate Run Details (exact numbers, run 2026-08-22)

| Gate | Command | Exact result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` (apps/backend) | exit 0 |
| Build | `npm run build --workspace=@mandarin/backend` | exit 0; `dist/app/index.js` 5137 B + `dist/nest/main.js` 2286 B emitted |
| Full unit | `npm run test:full` | **66 files / 744 tests passed** (5.90s) |
| Integration | `npm run test:integration` | **23 files / 262 tests passed** (82.61s) |
| Lint | `npm run lint` (eslint .) | exit 0 |
| Boundaries | `npm run check:module-boundaries` | exit 0 |
| Migration | `npx prisma migrate status` | 30 migrations, "Database schema is up to date!" |
| Nest prod boot | `node dist/nest/main.js` (PORT=3999) | booted; `GET /api/v1/health` → 200 |
