**Last Updated:** August 21, 2026

# Story 24.1: P0-1 Security Stopgap — Close the Live Cross-Tenant SRS Leak on Express

## Description

**As an** operations lead,
**I want to** close the confirmed P0-1 cross-tenant SRS leak **now, on the live Express backend**, before any NestJS shell work begins — the `ReviewRepository` structurally rejects `undefined` userId (no Prisma ignore-`undefined` path) and `ReviewController` drops its `req.userId!` non-null assertions in favor of an explicit 401,
**So that** no guest (or missing-auth) request can read or count another user's spaced-repetition rows while the rest of Epic 24 (and epics 25–28, which now queue behind it) migrates.

## Business Value

This is the **first story of the serial Epic 24** and the owner's P0-1-as-gate-1 priority preserved inside the epic. The leak is **live today** and confirmed on disk: `ReviewRepository.findByUserAndTypes(userId, …)` (`apps/backend/src/modules/review/repositories/ReviewRepository.ts`) passes `userId` straight into `prisma.reviewItem.findMany({ where: { userId, … } })`; when `userId` is `undefined` (a guest via `optionalAuth`), Prisma **ignores** the filter and returns **every user's rows**. `countDue(userId, …)` has the same pattern on `prisma.reviewItem.count`. `ReviewController` (`apps/backend/src/modules/review/api/ReviewController.ts`) uses `req.userId!` on `getReviewItems`, `recordRating`, and `getDueCount`. Under the serial model there is no epic-25 to front-load, so placing the stopgap **first** (before the shell scaffold, 24-2) is the only ordering that keeps the exposure window to **days, not the ~5-week epic**. It ships **independently** on Express — it does not wait for, and is not coupled to, the Nest shell. It also records the pre-migration test baseline (T1), the epic-level hard precondition that unlocks all later port work.

## Acceptance Criteria

- [ ] `ReviewRepository.findByUserAndTypes` and `ReviewRepository.countDue` structurally reject `userId === undefined` **before hitting Prisma** (throw a typed error or return an empty result), so there is no Prisma ignore-`undefined` path on any `optionalAuth` SRS read.
- [ ] `ReviewController` drops `req.userId!` on all three handlers (`getReviewItems`, `recordRating`, `getDueCount`) and returns an **explicit 401** (with the `{code, message, requestId}` envelope where the error handler applies) when no authenticated user is present.
- [ ] A **P0-1 regression test** is committed that proves a guest / missing-auth call returns 401 (or empty) and never another user's rows.
- [ ] **Test baseline recorded (T1 hard precondition):** `npm run test:full` + `npm run test:integration` run first; real pass/fail recorded and failures triaged in a verification artifact before this story's changes land.
- [ ] No other review surface changes (no port, no schema change, no quiz/progression/audio edits); the Nest shell is **not** required for this story to ship.
- [ ] Gates green: `npm run build`, `npm run lint` (0 errors), `npm run typecheck --workspace=@mandarin/backend`, `npm test`, `npm run test:full`, `npm run test:integration`.

## Business Rules

1. **Structural rejection, not controller-only** — the repository is the last line of defense: `undefined` userId is rejected inside `findByUserAndTypes`/`countDue` (throw or return empty) so no caller can ever leak rows via a Prisma ignore-`undefined` path, even if a future controller forgets the guard.
2. **Explicit 401 on missing user** — `req.userId!` is removed from `ReviewController`; a missing user yields a 401 response, never a `500` or a full-row read.
3. **Ships independently of the Nest shell** — this is a live-Express fix. It does not wait for 24-2 and is not reverted by the migration; the structural fix is re-authored as defense-in-depth in the review port (24-11) and enforced by the release-safety gate (24-14).
4. **Baseline first (epic-level hard precondition)** — record + triage the real full/integration test pass-fail before starting; the 2026-08-21 "green" claim is unverified.
5. **Tight scope** — only the two repository methods + the controller + the regression test + the baseline artifact change. No port, no schema, no shared-constants, no FE.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.2: NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern** ([BR](story-24-2-nest-shell-scaffold-proof.md)) (successor — begins the shell after the leak is closed)
- **Story 24.11: Review Port + SRS Schema** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-11--review-port--srs-schema)) (structural re-fix + absorbed `SrsCardState` additive schema)
- **Implementation (IMP twin):** `story-24-1-p0-1-security-stopgap.md` → `../../../issue-implementation/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md`

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
