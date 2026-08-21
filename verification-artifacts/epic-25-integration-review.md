# Epic 25 — Integration Review of the Calibrated State (Code Reviewer)

**Date:** 2026-08-21
**Scope:** Integration readiness audit of the calibrated guest-access / learning-vs-practices state against the **current code**, scoped to the surfaces Epic 25 (Secure Guest Identity & Route Gating) targets. Verification only — **no code changed.**
**Method:** codegraph + targeted reads against the calibration spec (`wip/guest-access-calibration.md`, condensed working spec) and `docs/planning/epics-25-40.md` (Epic 25 boundary + ACs).

---

## Summary

The calibrated design is **not yet integrated** — every surface Epic 25 is scoped to close is still in its pre-calibration state. This is expected (the calibration was "designs & reviews only"), and it confirms **Epic 25 is correctly scoped** — but under the **serial re-ratification (2026-08-21, D9)** Epic 24 (D7 NestJS shell-swap) runs **FIRST to completion** and Epic 25 lands **on NestJS after**. F1/F2/F6 map to Epic 24's absorbed scope (F1 → 24-7 guest identity; F2 → 24-1 P0-1 stopgap + 24-11 structural; F6 → 24-5/24-8/24-13 calibrated guards); F3/F5 are residual in 25 (FE route gating + TTS-surface verification on Nest).

## Findings (verified against current `main` @ `d331e7ad`)

### 🔴 F1 — Guest gate still over-generous (Epic 25 AC2 target)

`createGuestPhaseGate()` (`packages/shared-constants/src/index.js`) still returns **`currentPhase: 4, phase4Unlocked: true`** — guests get everything.
→ Calibrated target: `{ currentPhase: 1, isGuest: true }`. **Not done.**

### 🔴 F2 — P0-1 cross-tenant SRS leak still open (Epic 25 AC1 target)

`ReviewRepository.findByUserAndTypes(userId, …)` (`apps/backend/src/modules/review/repositories/ReviewRepository.ts:56`) passes `userId` straight into `prisma.reviewItem.findMany({ where: { userId, … } })`. If `userId` is `undefined` (guest via `optionalAuth`), **Prisma ignores it → returns every user's rows**. `ReviewController` uses `req.userId!` on `getReviewItems`/`getDueCount`/`recordRating`. **Not done.**

### 🔴 F3 — No route-level guard → Learn URL bypass open (Epic 25 AC3 target)

`LEARN_REQUIRED_PHASE` (`learnNav.ts`) drives **SideNav lock display only**. No global route guard exists (only `ChengyuPage` has a page-local gate). Direct navigation to a higher-phase Learn route (radicals / phonetic-clusters) is **not blocked**. **Not done.**

### 🟠 F4 — Missing regression-test coverage on the exact surfaces Epic 25 changes

codegraph reports **no covering tests** for: `ReviewController`, `countDue`, `findByUserAndTypes`, `getPhaseGate`, `GateResult`. The P0-1 guard and guest-gate lockstep would land without security/regression tests today. → Epic 25 close criteria already require "new P0-1 security tests" — confirmed necessary.

### 🟡 F5 — `optionalAuth` TTS surface present, guest-safety unverified

`POST /v1/tts` (`apps/backend/src/modules/audio/api/audioRoutes.ts`) is `optionalAuth`. Whether it is cache-first-free for guests (AC4) is not yet enforced/documented; generated-quota mechanics belong to Epic 29.

### 🟡 F6 — `optionalAuth` guest handling is inconsistent across controllers

Found on audio / mnemonics / progression routes; each controller treats missing `userId` differently (some return empty, some all-unlocked). Epic 25's "single source, one cache key, cleared on auth change" unification (AC2) addresses this.

### ℹ️ D7 note

All the above live in the Express modulith (`apps/backend/src/modules/*`) and will migrate to the NestJS shell (Epic 24). **Serial (2026-08-21, D9): Epic 24 runs first to completion; 25 lands on NestJS after.** F1/F2/F6 map to Epic 24's absorbed scope (F1 → 24-7 guest identity, F2 → 24-1 stopgap + 24-11 structural, F6 → 24-5/24-8/24-13 calibrated guards); **F3/F5 residual in 25** (FE route gating + guest-shell UI; TTS-surface verification on Nest).

## Verdict for the "ready for next epic" question

- ✅ **Foundation green**: build, tests, lint, design-audit, system-map all pass; history clean; COMMIT GATE binding.
- ✅ **Epic 25 correctly scoped**: AC1 (F2), AC2 (F1/F6), AC3 (F3), AC4 (F5) each map to a verified open gap.
- ⛔ **Not ready to start coding until** the missing prep artifacts exist: Epic 25 BR + 3 story BRs/impls, and the per-epic UI design spec (guest shell + route-gate fallback) via UIUX Step 1.

## Recommended close-out order (before Epic 25 kickoff)

1. Finish this integration review → **consolidate findings** into one calibration report (committed artifact).
2. Author Epic 25 BR + story BRs/impls (25-1 P0-1 guard, 25-2 guest-gate lockstep, 25-3 route gates + TTS).
3. UIUX Step 1: per-epic design spec → Storybook shell (guest shell + gate fallback) → preview gate.
4. Confirm next Chromatic run captures (baseline).
