**Last Updated:** August 21, 2026

# Implementation 24-1: P0-1 Security Stopgap — Close the Live Cross-Tenant SRS Leak on Express

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md`
> **Last Updated:** August 21, 2026
> **Status:** Planned

## Technical Scope

Close the confirmed P0-1 cross-tenant SRS leak on the **live Express backend** before any shell work: `ReviewRepository.findByUserAndTypes` and `ReviewRepository.countDue` structurally reject `userId === undefined` before hitting Prisma, and `ReviewController` drops `req.userId!` on all three handlers in favor of an explicit 401. Add the P0-1 regression test and record the pre-migration test baseline (T1 — epic-level hard precondition). Ships independently; does not wait for the Nest shell.

**Files:**

- `apps/backend/src/modules/review/repositories/ReviewRepository.ts` — **UPDATE**: `findByUserAndTypes` (and `countDue`) throw or return empty when `userId === undefined` **before** calling `prisma.reviewItem.*`, so there is no Prisma ignore-`undefined` path.
- `apps/backend/src/modules/review/api/ReviewController.ts` — **UPDATE**: remove `req.userId!` on `getReviewItems`/`recordRating`/`getDueCount`; return an explicit 401 when no authenticated user is present.
- `apps/backend/src/modules/review/repositories/__tests__/ReviewRepository.test.ts` (or existing repo test file) — **UPDATE/NEW**: P0-1 regression test — `userId === undefined` → no rows / thrown; a real userId → only that user's rows.
- `apps/backend/src/modules/review/api/__tests__/ReviewController.test.ts` (or existing controller test file) — **UPDATE/NEW**: missing-user → 401, never a full-row read.
- `verification-artifacts/` — **NEW**: baseline record (full + integration pass/fail + triage) — the T1 hard precondition.

## Implementation Details

### Structural rejection in `ReviewRepository`

The repository methods guard before any Prisma call, so no caller can leak rows through a Prisma ignore-`undefined` path:

```typescript
// ReviewRepository.findByUserAndTypes (current leak: userId: undefined → Prisma ignores → every user's rows)
async findByUserAndTypes(userId: string | undefined, itemTypes: string[]): Promise<ReviewItem[]> {
  if (userId === undefined) {
    // Structural rejection — no Prisma ignore-undefined path on any optionalAuth SRS read.
    return []; // or throw a typed UnauthorizedError; the controller maps missing-auth to 401
  }
  return prisma.reviewItem.findMany({
    where: { userId, itemType: { in: itemTypes } },
    orderBy: { nextReview: "asc" },
  });
}

// countDue — same guard, same pattern
async countDue(userId: string | undefined, itemTypePrefix: string): Promise<number> {
  if (userId === undefined) return 0; // structurally reject before prisma.reviewItem.count
  return prisma.reviewItem.count({
    where: { userId, nextReview: { lte: new Date() }, itemType: { startsWith: itemTypePrefix } },
  });
}
```

> Choose one consistent policy (return-empty vs throw) and document it; the P0-1 regression test pins the behavior. The serial report recommends the repository "throw or return empty" — the controller must map the missing-auth case to an explicit 401 either way.

### Drop `req.userId!` in `ReviewController`

```typescript
// Before (current): req.userId! — non-null assertion on a value that can be undefined for guests
const items = await this.reviewService.getReviewItems(req.userId!, { … });

// After: explicit 401 when no authenticated user
if (!req.userId) {
  return res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
}
const items = await this.reviewService.getReviewItems(req.userId, { … });
```

Applied to all three handlers: `getReviewItems`, `recordRating`, `getDueCount`. The 401 body follows the `{error, code}` shape used by the existing `ReviewController` error paths; the global `errorHandler` envelope (`{code, message, requestId}`) is preserved where it applies.

### P0-1 regression test

The test proves a guest / missing-auth call **never** returns another user's rows:

- `findByUserAndTypes(undefined, …)` → empty result (or typed error), **not** every user's rows.
- `countDue(undefined, …)` → 0 (or typed error), **not** a global count.
- `ReviewController` with `req.userId` absent → 401 on all three routes; with a real `userId` → that user's scoped rows only.

## Architecture Integration

```
[Story 24-1: P0-1 Security Stopgap]  ← first story of serial Epic 24, ships independently on Express
├── modules/review/repositories/ReviewRepository.ts — structural undefined-userId rejection (findByUserAndTypes + countDue)
├── modules/review/api/ReviewController.ts — req.userId! → explicit 401 (getReviewItems/recordRating/getDueCount)
├── P0-1 regression test — no guest/missing-auth read can leak rows
└── verification-artifacts/ — T1 baseline record + triage (epic-level hard precondition)
      ↓ re-authored as defense-in-depth in 24-11 (review port, Nest) + enforced by 24-14 (release-safety gate)
```

Dependencies: none (runs before 24-2; the only prerequisite is the T1 baseline record). Parallel-safety: touches only the review repository + controller + their tests — no schema, no shared-constants, no FE, no Nest shell. The structural fix is **kept** when the review port (24-11) re-authors it in Nest land.

## Technical Challenges & Solutions

### The Prisma ignore-`undefined` leak

```
Problem: prisma.reviewItem.findMany({ where: { userId: undefined, … } }) — Prisma silently
        drops the undefined filter → returns every user's rows. Confirmed live at
        ReviewRepository.findByUserAndTypes (and countDue via .count).
Solution: Guard at the repository boundary BEFORE any Prisma call — reject undefined userId
        structurally (return empty / throw). Controller additionally drops req.userId! and
        returns an explicit 401. Regression test pins "undefined ⇒ no rows, real id ⇒ own rows".
```

### Why a stopgap (not just the 24-11 structural fix)

```
Problem: The structural fix in the Nest review port (24-11) is ~5 weeks away under serial;
        the leak is exploitable today.
Solution: Land the stopgap as 24-1 on live Express, shipped independently. 24-11 re-authors
        the same rejection as defense-in-depth in Nest land; 24-14 (release-safety gate) blocks
        cutover without it. This keeps the exposure window to days, not the full epic.
```

### Doc Truth-Check

- [ ] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [ ] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [ ] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [ ] All relative markdown links resolve
- [ ] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **P0-1 regression test:** `findByUserAndTypes(undefined)`/`countDue(undefined)` return empty/0 (or throw) — never every user's rows; a seeded real user returns only their rows.
- **Controller test:** missing `req.userId` → 401 on `getReviewItems`/`recordRating`/`getDueCount`; present `req.userId` → normal flow, no `req.userId!`.
- **Baseline (T1):** `npm run test:full` + `npm run test:integration` run first, pass/fail recorded + triaged in a verification artifact.
- **Gates:** Tier 1 `build`/`lint` (0 errors)/`test`; Tier 2 `test:full`/`typecheck`/`check:module-boundaries`/`test:integration`.
