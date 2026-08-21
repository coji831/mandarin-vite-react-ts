**Last Updated:** August 21, 2026

# Story 24.11: Review Port + SRS Schema

## Description

**As a** backend engineer,
**I want to** port the `review` module — **`GET /v1/review/items`**, **`GET /v1/review/due-count`**, **`POST /v1/review/result`** — from Express (`ReviewController.ts`/`reviewRoutes.ts`) to the NestJS 11 shell under `modules/review/nest/`, landing the **structural P0-1 fix** in Nest land (the Nest repository rejects `undefined` userId at the type/guard level — defense-in-depth beyond the 24-1 Express stopgap) AND the **absorbed epic-28 `SrsCardState` additive schema/enum + reserved pgvector column** (the FV14 hedge, empty until RAG-1),
**So that** the review surface becomes contract-identical on the Nest shell with the cross-tenant leak closed structurally (guests are rejected 401 by the calibrated `RequireAuthGuard` from 24-5 at the HTTP boundary, and the repository structurally rejects `undefined` userId so no Prisma ignore-`undefined` path can ever survive), the review repository re-points to the **final SRS data shape** (`SrsCardState`, interval-doubling preserved — no FSRS semantics, that's epic-34), `ReviewItem` stays fully intact (additive-only migration, no destructive ops), and a dedicated DB-backed parity harness (real Express vs real Nest) proves the whole surface — all while the migration stays additive with the Express production path untouched until the 24-15 cutover.

## Business Value

Review is the **collision-core anchor** of Epic 24 — it is the module that carries BOTH the structural P0-1 fix and the absorbed epic-28 `SrsCardState` additive schema. The 24-1 story shipped the stopgap on live Express (return-empty repo guards + explicit 401, closing the leak in days); 24-11 is the **Nest/type-level half** — the repository re-pointed to `SrsCardState` structurally rejects `undefined` at the source, the calibrated `RequireAuthGuard` (24-5) rejects guests 401 at the HTTP boundary before the controller, and the P0-1 regression is **re-authored in Nest land** (controller test: 401 + no service call; repo test: `undefined` → `[]`/`0`, no Prisma call). The release-safety gate (24-14) enforces this as the cutover precondition.

Landing the absorbed epic-28 `SrsCardState` schema **with the migration epic** (not after) means the final SRS data shape ships inside Epic 24 — no **post-release schema migration on the P0-1-anchor repository**, which would be the worst double-touch. The additive-only migration (new `SrsState` enum + `SrsCardState` table + reserved pgvector column; zero `ReviewItem` drops/renames/alters) satisfies the D1 additive-only gate, and the review service re-points with **interval-doubling semantics preserved** (again=1d / good=double / easy=triple, capped 60d) — no FSRS behavior change (that's epic-34).

Porting review on the calibrated `RequireAuthGuard` also de-risks the **user-scoped-guard pattern** for the remaining ports — 24-12 readers and 24-13 quiz/progression are all user-scoped surfaces that follow the same shape. A dedicated DB-backed parity harness (`review-parity.test.ts`, 12 tests) registers real users and proves 2xx deep-equal (with `nextReview`/shuffle normalization), the 4xx envelope, guest 401 parity, and the **P0-1 no-leak** contract (user B never sees user A's rated SRS state) on both apps.

## Acceptance Criteria

- [x] **3 review routes ported** — `GET /v1/review/items`, `GET /v1/review/due-count`, `POST /v1/review/result` under `apps/backend/src/modules/review/nest/` (`review-nest.controller.ts` + `review.module.ts`), verbatim from `ROUTE_PATTERNS` (`reviewItems`/`reviewDueCount`/`reviewResult`), `/api` prefix applied by the shell; parity green.
- [x] **`findByUserAndTypes`/`countDue` structurally reject `undefined` userId (no leak) + regression test re-authored in Nest land** — the repository returns `[]`/`0` before any Prisma call (no Prisma ignore-`undefined` path); the controller test proves missing `req.userId` → explicit 401 + **no service call**; the repo test proves `undefined` → `[]`/`0` + **no Prisma call**, real id → Prisma call scoped to that user.
- [x] **Re-pointed to `SrsCardState` with interval-doubling preserved** — `ReviewRepository`/`types/review.ts` read/write the absorbed additive `SrsCardState` table (not `ReviewItem`); `recordRating` keeps again=1d / good=double / easy=triple, capped 60d — **NO FSRS** (that's epic-34).
- [x] **`ReviewItem` stays intact (additive-only migration, no destructive ops)** — the migration adds the `SrsState` enum + `SrsCardState` table + reserved pgvector column only; no `ReviewItem` column is dropped, renamed, or re-typed; `ReviewItem` stays fully live until the epic-28/34 destructive cleanup.
- [x] **Calibrated `requireAuth` applied** — all 3 routes use `@UseGuards(RequireAuthGuard)` (24-5 calibrated guard); guest (no token) → 401 `AUTH_REQUIRED` ("Please sign in to access this feature") before the controller, matching Express `requireAuth`.
- [x] **Parity green** — `review-parity.test.ts` (12 tests, DB-gated): 2xx deep-equal with `nextReview`/shuffle normalization, 4xx envelope parity, guest 401 parity, and the P0-1 no-leak A-vs-B check; `test:full` 62/666 (+7), `test:integration` 21/203 (+12), typecheck + build (both dist) + lint 0 + boundaries green.

## Business Rules

1. **Routes verbatim from `ROUTE_PATTERNS`** — `reviewItems` (`/v1/review/items`, GET), `reviewResult` (`/v1/review/result`, POST), `reviewDueCount` (`/v1/review/due-count`, GET); `/api` prefix applied by the shell. The Nest controller mirrors `ReviewController.ts` 1:1 — same query/body parsing + string coercion, same service delegation, same 2xx JSON, same 4xx `code`/`message` (the global 24-3 `AppExceptionFilter` serializes thrown `HttpException`s into the `{ code, message, requestId }` envelope).
2. **Structural P0-1 at the type/guard level** — the calibrated `RequireAuthGuard` (24-5) guarantees `req.userId` is present before the controller runs, so it is TYPED `string` in the Nest controller; the `if (!userId)` 401 is kept as defense-in-depth mirroring the Express controller structure (unreachable under the guard). The repository ALSO structurally rejects `undefined` userId (the shared 24-1 check) — the Nest path never leaks.
3. **`SrsCardState` re-point with interval-doubling preserved** — `ReviewRepository` reads/writes `prisma.srsCardState` (all methods); `recordRating` keeps the simple SRS interval-doubling (again=1d, good=double, easy=triple, capped 60d) — **no FSRS scheduling** (that's epic-34, and the 4-state `SrsState` enum is the FSRS-ready vocabulary it will consume).
4. **Additive-only migration (D1 gate)** — the absorbed epic-28 schema lands as a new enum + new table + reserved pgvector column; **no `ReviewItem` column is dropped, renamed, or re-typed**; `ReviewItem` stays fully live until the epic-28/34 destructive cleanup. The migration is idempotent (`CREATE EXTENSION IF NOT EXISTS vector`) and the `vector` column stays EMPTY (FV14 hedge) until RAG-1.
5. **Calibrated `requireAuth`** — all three routes are user-scoped SRS state (a write surface: guests never reach endpoints that persist their state), so a guest is rejected 401 (`AUTH_REQUIRED`) before the controller — matching Express `requireAuth`. There is no `optionalAuth` on review (unlike 24-10 TTS / 24-12 passage-audio).
6. **Additive-only port** — the Express review wiring (`ReviewController.ts`/`reviewRoutes.ts`/`container.ts`) is untouched; the Nest surface coexists until the module cutover (24-15). No `packages/shared-constants` / `packages/shared-types` / FE change.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([BR](story-24-5-auth-guards-calibrated.md)) (dependency — the calibrated `RequireAuthGuard` applied to all 3 review routes)
- **Story 24.1: P0-1 Security Stopgap** ([BR](story-24-1-p0-1-security-stopgap.md)) (related — the Express stopgap this story re-authors structurally in Nest land)
- **Story 24.14: Release-Safety Cutover Gate** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-14--release-safety-cutover-gate)) (successor — the release gate that enforces the structural P0-1 + additive-only schema at cutover)
- **Implementation (IMP twin):** `story-24-11-review-port-srs-schema.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-11-review-port-srs-schema.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `94374fa8`
- **Implementation note:** Review ported to the Nest shell (`review.module.ts` = 1:1 of `createReviewModule(deps)`, imports `GuardsModule`, exports `ReviewService`; `review-nest.controller.ts` = 3 routes verbatim, all `@UseGuards(RequireAuthGuard)`, `@HttpCode(200)` on result, structural P0-1 `req.userId as string` + defensive 401); additive `SrsCardState` schema/enum + reserved pgvector column landed (migration `20260821175536_add_srs_card_state`, additive-only, no BOM, `prisma migrate status` = 30 up-to-date); repository/types re-pointed `reviewItem → srsCardState` with interval-doubling preserved (no FSRS); P0-1 regression re-authored in Nest land (controller 7 tests + repo tests); parity harness `review-parity.test.ts` (12 tests) green. All 6 ACs verified against the shipped code (commit `94374fa8`) — commit hash deferred to epic close.
