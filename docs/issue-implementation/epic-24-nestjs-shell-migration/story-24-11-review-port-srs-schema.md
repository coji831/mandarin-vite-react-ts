**Last Updated:** August 21, 2026

# Implementation 24-11: Review Port + SRS Schema

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-11-review-port-srs-schema.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `94374fa8`

## Implementation Summary

Ported the `review` module (**`GET /v1/review/items`**, **`GET /v1/review/due-count`**, **`POST /v1/review/result`**) from Express to the NestJS 11 shell under `apps/backend/src/modules/review/nest/`, landing the **structural P0-1 fix** in Nest land AND the **absorbed epic-28 `SrsCardState` additive schema/enum + reserved pgvector column** (FV14 hedge). This is the collision-core anchor of the epic: it re-authors the 24-1 P0-1 stopgap at the type/guard level, re-points the review repository to the final SRS data shape, and proves the additive-only schema-migration discipline the 24-15 cutover depends on.

**`review.module.ts` = 1:1 of `createReviewModule(deps)`** (`modules/review/container.ts`): imports `GuardsModule` (for the calibrated `RequireAuthGuard` 24-5 + its `JwtService`), **NOT** `SharedModule` (`ReviewService`/`ReviewRepository` self-import the shared Prisma singleton like the characters/radicals ports — no external/cache/gemini deps); `ReviewRepository` provided via `useFactory: () => new ReviewRepository()`; `ReviewService` via `useFactory(repository)` (constructor-injected, the same dep the container factory takes); **`exports: [ReviewService]`**.

**`review-nest.controller.ts` = 3 routes verbatim** (`@Controller("v1/review")`): `@Get("items")`, `@Post("result")` (**`@HttpCode(200)`** — the Express `res.status(200).json(result)` vs Nest's POST default 201 fix), `@Get("due-count")` — all **`@UseGuards(RequireAuthGuard)`** (calibrated 24-5: guest → 401 `AUTH_REQUIRED` before the controller). **Structural P0-1:** `const userId = req.userId as string` (the guard guarantees presence, so it is TYPED `string`), with a defensive `if (!userId) throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Authentication required" })` mirroring the Express controller structure (unreachable under the guard). The controller mirrors `ReviewController.ts` 1:1 — same query/body string-coercion parsing, same service delegation, same 2xx JSON, same 4xx `code`/`message` (`MISSING_FIELDS` / `LOAD_FAILED` / `UPDATE_FAILED` serialized by the 24-3 `AppExceptionFilter`).

**Schema — additive `SrsCardState` (absorbed from epic-28):** `SrsState` enum (`New`/`Learning`/`Review`/`Relearning` — the FSRS-ready 4-state vocabulary, T14/ts-fsrs-compatible) + `SrsCardState` model (userId/itemType/itemId business key, `state` default `New`, `studyCount`/`correctCount`/`lapses`, `lastReviewed`/`nextReview`/`intervalDays`/`phaseId`/`source`, `updatedAt`) with a **reserved `Unsupported("vector")` column** (`vector vector` — the FV14 hedge, EMPTY until RAG-1). Migration `20260821175536_add_srs_card_state` = `CREATE EXTENSION IF NOT EXISTS vector` (idempotent; pgvector not enabled on the target DB — verified `pg_extension` has no `vector` row; the canonical Prisma + pgvector pattern) + the new enum/table/3 indexes/1 unique. **Additive-only — zero `ReviewItem` drops/renames/alters**; `ReviewItem` stays fully live until the epic-28/34 destructive cleanup. No BOM in the migration file (verified byte-for-byte); **`prisma migrate status` = 30 migrations up-to-date (already applied)**; **`prisma generate` regenerated the root-hoisted client** (`SrsCardState`/`SrsState` available to the repository types).

**Re-point — `reviewItem → srsCardState`:** `ReviewRepository` (all methods — `findDueItems`/`findRecentItems`/`findByUserAndItem`/`findByUserAndTypes`/`findById`/`create`/`update`/`upsert`/`countDue`) now read/write `prisma.srsCardState.*`; `types/review.ts` imports `SrsCardState` from `@prisma/client` (`IReviewRepository`/`SrsRecord` re-pointed). `findByUserAndTypes`/`countDue` keep the **structural `undefined` rejection** (`userId === undefined` → return `[]`/`0` before any Prisma call) — the shared 24-1 check, now verified against the live SRS table. **Interval-doubling preserved** in `ReviewService.recordRating` (again=1d / good=double / easy=triple, capped `MAX_INTERVAL = 60`) — **no FSRS** (that's epic-34).

**P0-1 regression re-authored in Nest land:** `review-nest.controller.test.ts` (7 tests — missing `req.userId` → `UnauthorizedException` 401 `{ code: "AUTH_ERROR", message: "Authentication required" }` + **no service call**; present userId → service delegation with parsed params) + `ReviewRepository.test.ts` (undefined → `[]`/`0` + **no Prisma call**; real id → Prisma call scoped to that user; mocks `prisma.srsCardState`).

**Parity harness `review-parity.test.ts` (12 tests, DB-gated):** boots the real Express app + real Nest `AppModule` in-process; registers two real users (A rates a tone item, B is fresh); proves guest 401 parity (×3), authed 2xx deep-equal with `nextReview`/shuffle normalization (×3), POST result interval-doubling (×3), 400 `MISSING_FIELDS` envelope parity (×2), and the **P0-1 no-leak A-vs-B check** (×1) — B's copy of the rated item shows `studyCount: 0`/`intervalDays: 1`, never A's state.

**Stale `ReadersAudioController.test.ts` disposition (investigated, NOT part of the schema/re-point):** the story stub AC listed "stale `ReadersAudioController.test.ts` rewritten/removed here or flagged for 24-12". Investigation found it is **NOT dead** — it uniquely covers `ReadersController.getPassageAudio` (`apps/backend/src/modules/readers/api/ReadersController.ts:133`), a **live Express method** still mounted on the production surface (`readersRoutes.ts:94`). Removing it would **drop live coverage** of a method 24-12 will port. Disposition: **left in place and flagged for 24-12** (the readers port re-homes its coverage in Nest land; the release-safety cutover 24-15 then retires the Express original).

**Verification (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 62 files / 666 tests (**+1 file / +7**: the review Nest controller suite) · `test:integration` ✅ 21 files / 203 tests (**+1 file / +12**: the review parity harness) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (all three review routes guest → 401 `AUTH_REQUIRED`).

## Technical Scope

Port the `review` module (3 routes) to the NestJS 11 shell with contract-identical behavior AND the structural P0-1 fix + the absorbed additive `SrsCardState` schema: a `ReviewModule` (1:1 of `createReviewModule(deps)`; imports `GuardsModule`; `ReviewRepository` + `ReviewService` via `useFactory`; exports `ReviewService`) with a verbatim `ReviewNestController` (3 routes, all `@UseGuards(RequireAuthGuard)`, `@HttpCode(200)` on result, structural P0-1 `req.userId as string` + defensive 401); the additive `SrsState` enum + `SrsCardState` model + reserved pgvector column in `schema.prisma` and the additive-only migration; the repository/types re-point `reviewItem → srsCardState` with interval-doubling preserved; the P0-1 regression re-authored in Nest land (controller 7 tests + repo tests); plus a dedicated DB-backed parity harness (12 tests). The Express review wiring is untouched.

**Files:**

- `apps/backend/src/modules/review/nest/review.module.ts` — **NEW**: `ReviewModule` — 1:1 of `createReviewModule(deps)` (imports `GuardsModule`; `ReviewRepository` + `ReviewService` via `useFactory`; **exports `[ReviewService]`**).
- `apps/backend/src/modules/review/nest/review-nest.controller.ts` — **NEW**: `ReviewNestController` (`@Controller("v1/review")`) — `GET /v1/review/items`, `POST /v1/review/result` (`@HttpCode(200)`), `GET /v1/review/due-count`, all `@UseGuards(RequireAuthGuard)`; structural P0-1 `req.userId as string` + defensive 401.
- `apps/backend/src/modules/review/nest/__tests__/review-nest.controller.test.ts` — **NEW**: P0-1 regression re-authored in Nest land (7 tests) — 401 + no service call on missing `req.userId`; delegation with present userId (defaults + string query coercion).
- `apps/backend/src/modules/review/repositories/ReviewRepository.ts` — **UPDATE**: re-pointed `reviewItem → srsCardState` (all methods `prisma.srsCardState.*`); `findByUserAndTypes`/`countDue` keep the structural `undefined` rejection (return `[]`/`0`).
- `apps/backend/src/modules/review/repositories/__tests__/ReviewRepository.test.ts` — **UPDATE**: P0-1 repo tests re-pointed to mock `prisma.srsCardState` (undefined → `[]`/`0` + no Prisma call; real id → scoped call).
- `apps/backend/src/modules/review/types/review.ts` — **UPDATE**: imports `SrsCardState` from `@prisma/client`; `IReviewRepository`/`SrsRecord` re-pointed to the new SRS shape.
- `apps/backend/prisma/schema.prisma` — **UPDATE**: additive `SrsState` enum (4 states) + `SrsCardState` model with reserved `Unsupported("vector")` column + unique/indexes.
- `apps/backend/prisma/migrations/20260821175536_add_srs_card_state/migration.sql` — **NEW**: additive-only migration — `CREATE EXTENSION IF NOT EXISTS vector` + enum/table/3 indexes/1 unique; **zero `ReviewItem` drops/renames/alters**; no BOM.
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import + register `ReviewModule` (route path `/v1/review/*` shares no prefix with any other module).
- `apps/backend/tests/integration/nest/review-parity.test.ts` — **NEW**: DB-gated parity harness (12 tests) — boots real Express + real Nest; registers two real users; guest 401, authed 2xx deep-equal (normalized), 400 envelope, P0-1 no-leak A-vs-B.

## Implementation Details

### ReviewModule — 1:1 of `createReviewModule(deps)`

```typescript
// apps/backend/src/modules/review/nest/review.module.ts
@Module({
  imports: [GuardsModule], // calibrated RequireAuthGuard (24-5) + its JwtService
  controllers: [ReviewNestController],
  providers: [
    { provide: ReviewRepository, useFactory: () => new ReviewRepository() },
    {
      provide: ReviewService,
      useFactory: (repository: ReviewRepository) => new ReviewService(repository),
      inject: [ReviewRepository],
    },
  ],
  exports: [ReviewService],
})
export class ReviewModule {}
```

Explicit `useFactory` + `@Inject()` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop. `GuardsModule` is imported so the calibrated `RequireAuthGuard` (24-5) and its `JwtService` resolve in this module's context for the controller's `@UseGuards(...)` decorators. **`SharedModule` is NOT imported** — `ReviewService`/`ReviewRepository` self-import the shared Prisma singleton like the characters/radicals ports (no external/cache/gemini deps). **`exports: [ReviewService]`** mirrors `createReviewModule`'s container export shape (a future consumer can inject the service).

### ReviewNestController — 3 routes verbatim + structural P0-1

```typescript
// apps/backend/src/modules/review/nest/review-nest.controller.ts
@Controller("v1/review")
export class ReviewNestController {
  constructor(@Inject(ReviewService) private readonly reviewService: ReviewService) {}

  @Get("items")
  @UseGuards(RequireAuthGuard) // calibrated 24-5: guest → 401 AUTH_REQUIRED before the controller
  async getReviewItems(
    @Query("source") sourceQuery: unknown,
    @Query("type") typeQuery: unknown,
    @Query("limit") limitQuery: unknown,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId as string; // structural P0-1: guard guarantees presence → typed string
    if (!userId) {
      throw new UnauthorizedException({ code: "AUTH_ERROR", message: "Authentication required" });
    }
    // ... string coercion → reviewService.getReviewItems(userId, { source, type, limit })
  }

  @Post("result")
  @HttpCode(200) // Express res.status(200).json(result) — Nest's default POST status is 201
  @UseGuards(RequireAuthGuard)
  async recordRating(@Body() body: {...}, @Req() req: Request): Promise<unknown> {
    // ... reviewService.recordRating(userId, { itemType, itemId, rating })
  }

  @Get("due-count")
  @UseGuards(RequireAuthGuard)
  async getDueCount(@Query("type") typeQuery: unknown, @Req() req: Request): Promise<unknown> {
    // ... reviewService.getDueCount(userId, type) → { count }
  }
}
```

All three routes are **user-scoped SRS state** (items + a write surface that persists state), so they mount the **calibrated guest-rejecting `RequireAuthGuard`** (24-5) — a guest is rejected 401 (`AUTH_REQUIRED`, "Please sign in to access this feature") at the HTTP boundary before the controller, matching Express `requireAuth`. The `if (!userId)` 401 is kept as **defense-in-depth** mirroring the Express controller structure (unreachable under the guard; unit-tested directly by constructing the controller with a user-less request, exactly like the 24-1 Express test). `@HttpCode(200)` on `recordRating` is the status-parity fix (Nest POST default 201 vs Express `res.status(200)` — the same class of fix as 24-9's `200 null` / 24-10's `@HttpCode(200)`).

### Schema — additive `SrsState` enum + `SrsCardState` model

```prisma
// apps/backend/prisma/schema.prisma (Story 24-11, ADDITIVE)
enum SrsState {
  New
  Learning
  Review
  Relearning
}

model SrsCardState {
  id           String    @id @default(uuid())
  userId       String
  itemType     String // same business-key vocabulary as ReviewItem
  itemId       String // identifier within the type
  state        SrsState  @default(New)
  studyCount   Int       @default(0)
  correctCount Int       @default(0)
  lapses       Int       @default(0) // ts-fsrs Card.lapses — pinned by inventory D5/T19
  lastReviewed DateTime?
  nextReview   DateTime  @default(now())
  intervalDays Int       @default(1)
  phaseId      Int       @default(1)
  source       String    @default("viewed")
  vector       Unsupported("vector")? // reserved pgvector column (FV14 hedge) — EMPTY until RAG-1
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, itemType, itemId])
  @@index([userId, nextReview])
  @@index([userId, phaseId])
  @@index([userId, source])
}
```

The 4-state vocabulary (T14, ts-fsrs/Anki-compatible) is the **FSRS-ready** per-item scheduling state (`ReviewItem → SrsCardState`, inventory D5). The `Unsupported("vector")` column is the **reserved pgvector slot** (FV14 hedge) — it stays **empty** until RAG-1 (epic-21 provisioned pgvector on Neon; the extension is enabled in the migration). `ReviewItem` is kept **fully intact** — no column dropped, renamed, or re-typed — and stays live until the epic-28/34 destructive cleanup.

### Migration — additive-only, no BOM, 30 up-to-date

```sql
-- apps/backend/prisma/migrations/20260821175536_add_srs_card_state/migration.sql
-- ADDITIVE-ONLY — new enum (SrsState) + new table (SrsCardState) + reserved pgvector column.
-- NO ReviewItem column is dropped, renamed, or re-typed.
CREATE EXTENSION IF NOT EXISTS vector;   -- idempotent; pgvector NOT enabled on the target DB (verified)

CREATE TYPE "SrsState" AS ENUM ('New', 'Learning', 'Review', 'Relearning');

CREATE TABLE "SrsCardState" ( ... "vector" vector, ... );   -- + 3 indexes + 1 unique (userId,itemType,itemId)
```

The migration is **additive-only** and satisfies the **D1 additive-only gate**: `CREATE EXTENSION IF NOT EXISTS vector` (idempotent — Prisma cannot emit extension creation for `Unsupported("vector")` columns, and pgvector is NOT enabled on the target database, verified via `pg_extension`; this is the canonical Prisma + pgvector pattern) + the new enum/table/3 indexes/1 unique. **Zero `ReviewItem` drops/renames/alters.** The file has **no BOM** (verified byte-for-byte — first bytes `45 45 32` = `-- `). **`prisma migrate status` = 30 migrations up-to-date** (the migration was already applied); **`prisma generate` regenerated the root-hoisted client** so `SrsCardState`/`SrsState` are available to the repository/types.

### Re-point — `reviewItem → srsCardState`, interval-doubling preserved

`ReviewRepository` now reads/writes `prisma.srsCardState.*` in every method, and `types/review.ts` imports `SrsCardState` from `@prisma/client`. The P0-1 structural rejection is unchanged and re-verified against the live table:

```typescript
// apps/backend/src/modules/review/repositories/ReviewRepository.ts
async findByUserAndTypes(userId: string | undefined, itemTypes: string[]): Promise<SrsCardState[]> {
  if (userId === undefined) {
    return []; // structural P0-1: no Prisma ignore-`undefined` path → no cross-user leak
  }
  return prisma.srsCardState.findMany({
    where: { userId, itemType: { in: itemTypes } },
    orderBy: { nextReview: "asc" },
  });
}
```

Interval-doubling is preserved in `ReviewService.recordRating` (`ReviewService.ts`): `again` → 1d, `good` → `min((current?.intervalDays || 1) * 2, MAX_INTERVAL)`, `easy` → `min(... * 3, MAX_INTERVAL)` with `MAX_INTERVAL = 60` — **no FSRS semantics** (that's epic-34; the 4-state enum is the FSRS-ready vocabulary it will consume).

### The parity harness — DB-backed proof

`tests/integration/nest/review-parity.test.ts` boots both the production Express app and the real Nest `AppModule` in-process via supertest, registers **two real users** (A rates a tone item, B stays fresh), and cleans up the `SrsCardState`/`session`/`user` rows in `afterAll`. Coverage: **guest 401** (all 3 routes → 401 `AUTH_REQUIRED`, no SRS row written on the POST), **authed 2xx deep-equal** (source=recent `[]`, source=all&type=tone normalized, due-count `{ count: 0 }`), **POST result interval-doubling** (good → `{ intervalDays: 2, studyCount: 1 }`, again → `{ intervalDays: 1, studyCount: 2 }`, due-count-after), **400 `MISSING_FIELDS` envelope parity** (missing fields / invalid rating), and the **P0-1 no-leak check** (user B's copy of the rated `tone-syllable/1` shows `studyCount: 0`/`intervalDays: 1` — a cross-user leak would surface A's state). The two inherently non-deterministic dimensions are normalized before deep-equal: `nextReview` → sentinel `"NEXT"` (per-request `now`), and item ORDER → sorted by `itemType:itemId` (`ReviewService` shuffles). The content case uses `type=tone` (5 seeded rows, deterministic, no random `options` array). Unique TEST-NET-3 `X-Forwarded-For` IPs per request (never trips the auth limiter).

## Architecture Integration

```
[Story 24-11: Review Port + SRS Schema]
├── modules/review/nest/review.module.ts — 1:1 of createReviewModule(deps); imports
│     GuardsModule (NOT SharedModule); ReviewRepository + ReviewService via useFactory;
│     exports [ReviewService]
├── modules/review/nest/review-nest.controller.ts — 3 routes verbatim (@Controller
│     "v1/review"): GET items / POST result (@HttpCode(200)) / GET due-count — all
│     @UseGuards(RequireAuthGuard) (24-5); structural P0-1 req.userId as string + 401
├── modules/review/nest/__tests__/review-nest.controller.test.ts — 7 unit tests (P0-1
│     regression re-authored: 401 + no service call; delegation with userId)
├── modules/review/repositories/ReviewRepository.ts — UPDATE: re-pointed reviewItem →
│     srsCardState (all methods); findDue/findByUserAndTypes/countDue reject undefined
├── modules/review/repositories/__tests__/ReviewRepository.test.ts — UPDATE: P0-1 repo
│     tests re-pointed (mock prisma.srsCardState; undefined → []/0, no Prisma call)
├── modules/review/types/review.ts — UPDATE: SrsCardState from @prisma/client; SrsRecord
│     re-pointed (interval-doubling preserved, no FSRS)
├── prisma/schema.prisma — UPDATE: additive SrsState enum + SrsCardState model (reserved
│     Unsupported("vector") column, FV14 hedge) — ReviewItem INTACT
├── prisma/migrations/20260821175536_add_srs_card_state/migration.sql — NEW: additive-only
│     (CREATE EXTENSION IF NOT EXISTS vector + enum/table/indexes/unique); no BOM; 30
│     migrations up-to-date
├── nest/app.module.ts — UPDATE: imports ReviewModule (no prefix overlap)
├── tests/integration/nest/review-parity.test.ts — DB-gated parity harness (12 tests: guest
│     401 ×3, authed 2xx ×3, POST result ×3, 400 envelope ×2, P0-1 no-leak ×1)
├── Express modules/review (container.ts, api/ReviewController.ts, api/reviewRoutes.ts) —
│     UNTOUCHED (production surface until 24-15 cutover)
└── Dependencies: 24-3 (envelope) · 24-5 (calibrated RequireAuthGuard) · 24-1 (P0-1 stopgap,
    re-authored structurally here)
```

Dependencies: **24-3** (the `{ code, message, requestId }` envelope), **24-5** (the calibrated `RequireAuthGuard`), **24-1** (the P0-1 stopgap re-authored structurally here). Absorbed scope: **epic-25 P0-1 (structural half)** + **epic-28 `SrsCardState` schema/vector (additive)**. Parallel-safety: **additive** — the Express review wiring is untouched; the migration is additive-only (no `ReviewItem` destructive op); **no** `packages/shared-constants` / `packages/shared-types` / FE change; **no** 25–28 collision-zone file touched. Consumers/successors: **24-12 (readers)** inherits the user-scoped `RequireAuthGuard` pattern; **24-14** enforces the structural P0-1 + additive-only schema at cutover; **epic-34** replaces interval-doubling with FSRS on the `SrsState` vocabulary.

## Technical Challenges & Solutions

### The additive `SrsCardState` migration — no destructive ops, pgvector reservation

```
Problem: the absorbed epic-28 SRS schema (SrsCardState) had to land on the most
        security-sensitive table in the app (the P0-1-anchor review repo) WITHOUT
        violating the D1 "no destructive op on the release" gate. A naive schema
        change could have dropped/renamed ReviewItem columns (breaking the live
        Express path mid-migration), and the reserved pgvector column required a
        Postgres extension Prisma cannot create itself.
Root Cause: `Unsupported("vector")` columns need `CREATE EXTENSION vector` on the DB
        (pgvector is NOT enabled on the target — verified via `pg_extension`), and
        ReviewItem must stay live until the epic-28/34 destructive cleanup (which
        is gated by the FSRS engine, epic-34). Any destructive op here would
        violate the additive-only-at-cutover constraint.
Solution: migration `20260821175536_add_srs_card_state` is purely ADDITIVE — it adds
        `CREATE EXTENSION IF NOT EXISTS vector` (idempotent, the canonical Prisma +
        pgvector pattern) + the new `SrsState` enum + the new `SrsCardState` table +
        3 indexes + 1 unique. ZERO `ReviewItem` drops/renames/alters — ReviewItem
        stays fully live. The `vector` column is reserved and EMPTY (FV14 hedge)
        until RAG-1. The migration has no BOM; `prisma migrate status` = 30
        up-to-date (already applied); `prisma generate` regenerated the
        root-hoisted client.
Impact: the final SRS data shape ships inside the migration epic (no post-release
        schema migration on the P0-1-anchor repo — the worst double-touch), the D1
        additive gate is satisfied, and 24-15's migration-safety pre-flight has a
        clean additive precedent to point at.
Alternatives Considered: deferring the schema to epic-28 (rejected — 28 would then
        run a post-release migration on the review repo right after the migration,
        the worst double-touch); a destructive in-place re-type of ReviewItem
        (rejected — violates the D1 additive-only gate).
```

### The structural P0-1 re-point — from Express stopgap to Nest type/guard level

```
Problem: the 24-1 stopgap closed the cross-tenant SRS leak on Express with
        return-empty repository guards + an explicit 401 in ReviewController.
        Porting review to Nest naively would have re-introduced the leak surface:
        if the Nest controller kept Express-style `req.userId!` non-null assertions
        (or an `optionalAuth` mount), a guest could reach the repository with
        `undefined` userId and Prisma's ignore-`undefined` where-key would return
        EVERY user's rows again.
Root Cause: the leak is a Prisma semantics hazard (`where: { userId: undefined }`
        silently drops the key) that must be closed at EVERY layer — the 24-1
        Express stopgap closed the repository, but the Nest port needed its own
        structural defense-in-depth at the type/guard level.
Solution: three reinforcing layers in Nest land — (1) the calibrated `RequireAuthGuard`
        (24-5) rejects guests 401 at the HTTP boundary BEFORE the controller (so
        `req.userId` is guaranteed present and TYPED `string` — `req.userId as
        string`); (2) the controller keeps a defensive `if (!userId)` 401
        (`{ code: "AUTH_ERROR", message: "Authentication required" }`) mirroring the
        Express controller structure (unreachable under the guard, but unit-tested
        by constructing the controller with a user-less request); (3) the repository
        `findByUserAndTypes`/`countDue` retain the shared 24-1 structural rejection
        (`undefined` → `[]`/`0` before any Prisma call). The P0-1 regression is
        re-authored in Nest land (controller test: 401 + no service call; repo test:
        `undefined` → no Prisma call, real id → scoped), and the parity harness adds
        the A-vs-B no-leak check (user B never sees user A's rated SRS state).
Impact: the Nest path cannot leak by construction; the release-safety gate (24-14)
        enforces it as the cutover precondition; the same 3-layer pattern is the
        template for the remaining user-scoped ports (24-12 readers, 24-13
        quiz/progression).
Alternatives Considered: porting review with `OptionalAuthGuard` + relying on the
        repository guard alone (rejected — a guest would still hit the service and
        could leak through any code path that forgets the check; review is a
        user-scoped write surface, so requireAuth is the correct calibrated mount).
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `reviewItems` (`GET /v1/review/items`), `reviewDueCount` (`GET /v1/review/due-count`), `reviewResult` (`POST /v1/review/result`), `/api` prefix applied by the shell
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `ReviewModule`/`ReviewNestController`/`ReviewService`/`ReviewRepository`/`SrsCardState`/`SrsState`/`RequireAuthGuard`/`GuardsModule` copied from the shipped `modules/review/nest/**`, `modules/review/repositories/**`, `modules/review/types/review.ts`, `prisma/schema.prisma`, `nest/app.module.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — review is DB-backed (`prisma.srsCardState.*` reads/writes, re-pointed from `ReviewItem`); the parity harness is DB-gated (`checkDatabase`) and registers real users; content files feed `getReviewItems` via the framework-agnostic `ReviewService` (unchanged)
- [x] All relative markdown links resolve (sibling story BRs 24-1/24-5 exist; the epic README exists; 24-14 stub link target exists)
- [x] Last Updated / Last Update date is current (same commit as the edit) — August 21, 2026; the 24-11 epic README row + BR/IMP updated in the same commit
- [x] Migration facts verified byte-for-byte: additive-only SQL (no `ReviewItem` drops/renames/alters), no BOM (first bytes `45 45 32`), 30 migration folders (up-to-date)

## Testing Implementation

- **Controller unit tests** (`src/modules/review/nest/__tests__/review-nest.controller.test.ts`, **7 tests**) — P0-1 regression re-authored in Nest land: for each of the 3 handlers, a missing `req.userId` → `UnauthorizedException` (401, `{ code: "AUTH_ERROR", message: "Authentication required" }`) and the service is **NOT called**; a present userId → service delegation with parsed params (defaults `source: "due"`, `type: ""`, `limit: 20`; string query pass-through + non-string coercion to `undefined`).
- **Repository unit tests** (`src/modules/review/repositories/__tests__/ReviewRepository.test.ts`, **re-pointed**) — mock `prisma.srsCardState` (the live SRS table): `findByUserAndTypes(undefined)` → `[]` + **no `findMany` call**; defined → `findMany` scoped `{ where: { userId, itemType: { in } }, orderBy: { nextReview: "asc" } }`; `countDue(undefined)` → `0` + **no `count` call**; defined → `count` scoped to that user's due rows.
- **DB-gated parity harness** (`tests/integration/nest/review-parity.test.ts`, **12 tests**) — boots the real production Express app (`src/app/index.ts`) + the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` on a missing DB; registers two real users via Express `/auth/register` (rows cleaned in `afterAll`); unique TEST-NET-3 `X-Forwarded-For` IPs. Coverage:
  - **guest 401 (3)**: all three routes → 401 `AUTH_REQUIRED` parity (envelope `code`/`message` byte-equal; the POST also proves **no SRS row is written**).
  - **authed 2xx (3)**: `source=recent` → `[]` deep-equal (fresh user); `source=all&type=tone` → 5 tone items normalized deep-equal (nextReview sentinel + sort); `due-count` → `{ count: 0 }` deep-equal.
  - **POST result (3)**: `good` → `{ intervalDays: 2, studyCount: 1 }` (1×2 doubling); due-count-after → `{ count: 0 }`; `again` → `{ intervalDays: 1, studyCount: 2 }` (reset to 1d).
  - **400 envelope (2)**: missing fields / invalid rating → 400 `MISSING_FIELDS` parity (message byte-equal).
  - **P0-1 no-leak (1)**: user B (fresh) reads the route after user A rated a tone item — B's copy of the `itemId` shows `studyCount: 0`/`correctCount: 0`/`intervalDays: 1`, never A's `studyCount: 2` (a cross-user leak would surface A's state).
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` 62/666 (+1 file / +7) ✅ · `test:integration` 21/203 (+1 file / +12) ✅ · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke ✅ (all three review routes guest → 401 `AUTH_REQUIRED`).
