---
purpose: P0-1 — repository-level rejection of undefined userId on every optionalAuth SRS read
status: completed
last-verified: 2026-10-27
type: story
---

# Story 25.1: P0-1 Guest Isolation — Repository-Level SRS Rejection

**Last Updated:** October 27, 2026

## Description

**As a** guest,
**I want to** have every spaced-repetition read scoped to my own (non-existent) identity,
**So that** I can never see or count another learner's review state.

## Business Value

P0-1 is the only confirmed cross-tenant data leak in the product. Prisma silently drops `undefined`
where-keys, so `findMany({ where: { userId: undefined } })` returns **every** user's rows. Any
`optionalAuth` route that forwards a guest's missing `userId` into a repository read therefore leaks
another learner's spaced-repetition state. Epic 24 landed the stopgap for the review repository; this
story makes the guarantee complete across the NestJS surface and pins it with regression tests so a
future route cannot re-open the window. Trust is the product's core asset — a demo funnel that leaks
study history is worse than no funnel.

## Acceptance Criteria

- [x] AC 1 **measured starting point** (2026-10-27): of 15 `OptionalAuthGuard` routes, none can reach `srsCardState` — `review` is 100 % `RequireAuthGuard`, and every other guest branch short-circuits. The two optional-userId SRS reads already reject structurally. This story therefore **records and pins** the audit rather than re-fixing it: every `optionalAuth` read listed on one line in the story impl doc (route, repository/service method, behaviour for `undefined`, and the guard that makes it unreachable where applicable), including the non-SRS `MnemonicsRepository.findByCharacterAndUser` (drops the filter on `null`; unreachable because `MnemonicsService.ts:55` wraps it in `if (userId)`). _Verified: the 15-row route table + 7-row signature table are in the [implementation](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-1-optional-auth-srs-guest-isolation.md), and `optional-auth-coverage.test.ts` asserts the discovered sets equal them._
- [x] `ReviewRepository.findByUserAndTypes` and `ReviewRepository.countDue` still return empty / `0` for `undefined` (no regression of the 24-1/24-11 behaviour) — asserted by test. _Verified: `ReviewRepository.ts:86-88` / `:166-168`; asserted directly in `tests/integration/nest/review-guest-isolation.test.ts` and cited as live lines by the inventory test._
- [x] Any _other_ repository read reachable from an `optionalAuth` route that accepts an optional `userId` is either structurally rejected the same way, or documented as unreachable-for-guests **with the exact guard line** that makes it so (minimum: `MnemonicsRepository.findByCharacterAndUser`). _Verified: `guarded-unreachable:mnemonics/services/MnemonicsService.ts:55` (and `:120` for the upsert write path); the two guest-reachable readers declarations are dispositioned `guest-safe-no-user-scope` with their cited line._
- [x] The review read path under guest auth returns **401** (guard) or an empty session-local result — never another user's rows — proven by a committed P0-1 regression test on the HTTP surface. _Verified: `review-guest-isolation.test.ts` asserts anonymous `GET /v1/review/items` and `/v1/review/due-count` → `401 AUTH_REQUIRED`._
- [x] A regression test proves the leak shape cannot return: with two users' SRS rows seeded, an anonymous read returns nothing from either user. _Verified: the two-user seed runs a **positive control first** (A sees `7` on tone 1 / B sees `9` on tone 2), then asserts the guest gets nothing — so a broken seed cannot make the test pass trivially._
- [x] `npm run typecheck --workspace=@mandarin/backend` passes and the affected module test suites pass. _Verified at epic close: `tsc --noEmit` exit 0; backend full suite 55 files / 631 tests pass._

## Business Rules

1. **Structure beats discipline.** The repository is the last line of defence: `undefined` userId must be rejected there, not only at the controller, because the next route can forget the controller check.
2. **Guests get nothing, not everything.** An absent identity resolves to an empty result set for SRS reads — never to an unscoped query.
3. **Defence in depth.** `RequireAuthGuard` (HTTP boundary) and the repository rejection (data boundary) are both required; neither replaces the other.

## Related Issues

- **Epic 25: Secure Guest Identity & Route Gating** _(link to `../epic-25-secure-guest-identity-and-route-gating/README.md`)_ (Parent)
- **Story 24.1: P0-1 Security Stopgap** _(link to `../epic-24-nestjs-shell-migration/story-24-1-p0-1-security-stopgap.md`)_ (Predecessor — landed the stopgap)
- **Story 24.11: Review Port + SRS Schema** _(link to `../epic-24-nestjs-shell-migration/story-24-11-review-port-srs-schema.md`)_ (Predecessor — structural port)
- **Story 25.2: Guest Identity Lockstep** _(link to `story-25-2-guest-identity-lockstep.md`)_ (Sibling)

## Implementation Status

- **Status**: Completed
- **PR**: #61
- **Merge Date**: 2026-10-30 (merged via PR #61, commit 6e84c12e)
- **Key Commit**: `17fdbcdb` (test(story-25-1): pin P0-1 guest isolation with an executable inventory)
