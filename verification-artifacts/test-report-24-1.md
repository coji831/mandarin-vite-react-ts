# Story 24-1 — P0-1 Security Stopgap: Test Baseline + Verification Report

**Date:** August 21, 2026
**Branch:** `epic-24-nestjs-shell-migration`
**Story:** [BR](../../docs/business-requirements/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md) · [IMP](../../docs/issue-implementation/epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md)

## Purpose

Records the **T1 hard precondition** (the epic-level pre-migration test baseline) for serial Epic 24, then the post-change verification of the P0-1 stopgap that closes the live cross-tenant SRS leak on Express.

## 1. Pre-change baseline (T1 — recorded BEFORE the stopgap landed)

Run against the **current Express backend before any Story 24-1 code change**.

| Check | Command | Result |
| --- | --- | --- |
| Review module tests | `npx vitest run src/modules/review/` (in `apps/backend`) | ✅ PASS — 1 file / 12 tests |
| Backend typecheck | `npx tsc --noEmit` (in `apps/backend`) | ✅ PASS (exit 0) |
| Backend full unit suite | `npm run test:full` (in `apps/backend`) | ✅ PASS — 54 files / 595 tests |
| Backend integration suite | `npm run test:integration` (in `apps/backend`) | ✅ PASS — 14 files / 82 tests |

**Pre-existing failures encountered in the baseline run:** none. (Backend `npm run lint` has a known pre-existing backlog — `KF-002` in `docs/guides/testing/known-failures.md` — not re-triaged here; scoped eslint on the touched review-module files is clean.)

> The story BR's 2026-08-21 "green" claim is now **verified on disk**: both the full unit and integration suites are green pre-change.

## 2. Post-change verification (stopgap landed)

| Check | Command | Result |
| --- | --- | --- |
| Backend typecheck | `npx tsc --noEmit` (in `apps/backend`) | ✅ PASS (exit 0) |
| Review module tests | `npx vitest run src/modules/review/` (in `apps/backend`) | ✅ PASS — 3 files / 22 tests (12 existing + 10 new P0-1 regression) |
| Backend full unit suite | `npm run test:full` (in `apps/backend`) | ✅ PASS — 56 files / 605 tests (no regressions) |
| Backend integration suite | `npm run test:integration` (in `apps/backend`) | ✅ PASS — 14 files / 82 tests |
| Lint (review module) | `npx eslint src/modules/review/` (in `apps/backend`) | ✅ PASS (exit 0) |

**New failures introduced by Story 24-1:** none.

## 3. Regression tests added (P0-1)

- `ReviewRepository.test.ts` — `findByUserAndTypes(undefined)` → `[]` **and** no Prisma call; `countDue(undefined)` → `0` **and** no Prisma call; defined userId → Prisma called with `where: { userId }` scoping.
- `ReviewController.test.ts` — missing `req.userId` → **401** `{ error: "Authentication required", code: "AUTH_ERROR" }` on `getReviewItems` / `recordRating` / `getDueCount`, service never called; present `req.userId` → normal delegation (no `req.userId!`).

## 4. Chosen mechanism for undefined rejection

**Return-empty** (`[]` / `0`), not throw — fail-closed without crashing: a guest gets an empty result, never another user's rows and never a 500. The controller maps missing-auth to 401 before the repository is ever reached, so the repository guard is defense-in-depth; returning empty is the safest behavior if a future caller forgets the guard. Matches the story IMP's primary code example.

## 5. Scope notes

- Only the review module was touched (repository, controller, types, tests) + this artifact. No NestJS shell work, no Prisma schema changes, no other modules, no frontend.
- Review routes already use `requireAuth` (401 at the middleware for missing/invalid tokens); the controller guard is defense-in-depth so a missing `req.userId` can never deref or leak.
- Not run here (out of scope for this stopgap): monorepo-wide `npm run build` (no FE changes), `test:full`/`test:integration` for the frontend workspace, `test:full` across the whole monorepo.

## 6. Files in this commit

- `apps/backend/src/modules/review/repositories/ReviewRepository.ts`
- `apps/backend/src/modules/review/api/ReviewController.ts`
- `apps/backend/src/modules/review/types/review.ts`
- `apps/backend/src/modules/review/repositories/__tests__/ReviewRepository.test.ts` (new)
- `apps/backend/src/modules/review/api/__tests__/ReviewController.test.ts` (new)
- `verification-artifacts/test-report-24-1.md` (this file)
