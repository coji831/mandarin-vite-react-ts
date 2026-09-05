---
purpose: Epic 25 Secure Guest Identity & Route Gating — data-driven Learn route gating (all 6 routes) + guest-shell UI + TTS guest-cost verification (residual after epic-24 absorption)
status: completed
last-verified: 2026-09-05
type: epic
---

# Epic 25: Secure Guest Identity & Route Gating

## Epic Summary

**Goal:** Make guest mode safe and correct — **data-driven `LEARN_REQUIRED_PHASE` route gating on all 6 Learn routes** (closing the radicals + phonetic-clusters URL bypass), a **guest-shell UI** (compact passive Guest badge + shared LockedSurface gate screen replacing the silent redirect-to-foundations), and **TTS guest-cost verification on Nest** (both `optionalAuth` surfaces verified cache-first-free-for-guests, with generated-audio quota mechanics recorded as epic-29's).

**Key Points:**

- **Absorption framing (binding):** Epic 25's original P0-1 (cross-tenant SRS leak) + guest-identity-lockstep concerns were **absorbed into Epic 24** under the serial re-ratification (24-1 stopgap, 24-7 identity calibration, 24-11 structural). Epic 25 does **NOT** re-implement the guest identity shape `{currentPhase: 1, isGuest: true}` — that shape was landed by Epic 24 story **24-7** (`createGuestPhaseGate` in `packages/shared-constants`, `PhaseGate.isGuest?: boolean` in `shared-types`, the `AppLayout` single-source `effectivePhase`, and `AppLayout.guest.integration.test.tsx`). Epic 25 consumes it.
- **Residual scope ships as one story (25-1):** (1) one data-driven `LearnRouteGate` + `LEARN_ROUTE_CONFIG` covers all six Learn routes (`foundations`/`radicals`/`grammar`/`phonetic`/`readers`/`chengyu`) deriving `label` + `requiredPhase` from `LEARN_NAV_ITEMS` (single source of truth, `shared/constants/learnNav.ts`) — replacing the old redirect-only, hardcoded grammar/readers/chengyu wrapper; (2) the shared `LockedSurface` gate screen (S2) renders on below-phase direct navigation (guest or authed) instead of the silent redirect-to-foundations; (3) a compact passive **Guest** identity badge in `AppTopBar` (S1 — no CTA/upsell); (4) TTS guest-cost verification on both `optionalAuth` surfaces (`POST /v1/tts` via `apps/backend/src/modules/audio/nest/audio-nest.controller.ts`, passage-audio via `apps/backend/src/modules/readers/nest/readers-nest.controller.ts`) — **no backend code change needed**.
- **NON-GOALS respected:** guest CTA/copy/value-moment (epic-26 `GuestUpsell`), demo-quota server counters + generated-TTS quota mechanics (epic-29), no backend code changes.

**Status:** ✅ Completed — implementation + tests + docs authored in the working tree on branch `solar-v5-wire`; local gates green (`tsc -b --noEmit` 0 errors · 8 affected test files / 18 tests pass · `check:registry-stories` 36/36 · no NEW `design-audit` errors). Final merge + commit hash pending the Code Reviewer verdict and the owner commit gate (COMMIT GATE) — story `25-1` PR/commit fields stay `TBD` until commit.

**Last Update:** September 5, 2026

> **Story docs:** this epic's Phase-A residual is fully authored (BR + IMP for story 25-1), each closed at the point it ran; commit hashes are filled at commit time. See the epic [IMP README](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/README.md) for the per-story status + impl summary.

## Background

The ratified plan (`docs/planning/epics-25-40.md` — Epic 25 row) defined Epic 25 as "Secure Guest Identity & Route Gating _(Phase A)_": close the P0-1 cross-tenant SRS leak, land the guest identity shape (`isGuest` + `currentPhase: 1`) in lockstep across backend and shell, gate every Learn route, and verify the two `optionalAuth` TTS surfaces are guest-governed.

Under the **serial re-ratification (2026-08-21, D10)** Epic 24 runs first to completion and absorbs the cross-cutting release-safety items: the P0-1 stopgap (24-1), the calibrated guest identity + minimal FE lockstep (24-7), and the structural P0-1 fix (24-11). The guest identity shape `{currentPhase: 1, isGuest: true}` therefore **already landed** in Epic 24 — `createGuestPhaseGate()` returns the calibrated Phase-1 gate and `PhaseGate.isGuest?: boolean` is additive on `shared-types`; the FE shell consumes the single-source `effectivePhase`. What remained for Epic 25 was the residual FE route gating + guest-shell UI + the TTS-surface verification artifact — the scope documented here.

Two pre-serial plan concerns did **not** ship here by design: the **URL bypass** on `/learn/radicals` and `/learn/phonetic-clusters` (below-phase direct navigation rendered content because the old gate was redirect-only and applied to only grammar/readers/chengyu) and the **silent redirect-to-foundations** (no locked-surface screen existed). Both are closed by story 25-1.

The TTS read/cache path resolution is split across epics per OI-3 (`epics-25-40.md`): Epic 25 verifies both `optionalAuth` surfaces are **cache-first-free for guests** (a GCS cache HIT re-signs the URL with `{ cached: true }` and never makes a billable Google TTS call), and records that **generated-audio quota mechanics are epic-29's** (the unified L5 quota spine). Epic 25's verification is the gate: if either surface were NOT cache-first today, Epic 25 would flip it to guest-gated before Epic 29.

## User Stories

This epic consists of the following user story (the residual Phase-A scope, re-sliced after Epic 24's absorption — the pre-serial plan's three-story numbering 25-1/25-2/25-3 is superseded; see Story Breakdown Logic):

1. **25-1 — Data-Driven Learn Route Gating + Guest-Shell UI + TTS Guest-Cost Verification** ([BR](story-25-1-route-gating-guest-shell.md))
   - As a guest or below-phase learner, I want direct navigation to any locked higher-phase Learn route to show a neutral locked-surface gate screen (never the content, never a silent redirect), a passive Guest identity badge in the shell, and a verified cache-first-free TTS read path, so that the guest mode is safe, honest, and consistent.

## Story Breakdown Logic

- **Stories 25-1** focus on the entire residual Phase-A scope (completed).
- The pre-serial plan's story numbering (`25-1 P0-1 guard`, `25-2 guest-gate lockstep`, `25-3 route gates + TTS verification`) is **superseded by the serial re-ratification**: the `25-1` P0-1 and `25-2` guest-gate-lockstep concerns were **absorbed into Epic 24** (24-1 stopgap / 24-7 identity / 24-11 structural). What remains for Epic 25 is exactly the residual listed in the plan's dependencies line — FE route gating + guest-shell UI + TTS-surface verification on Nest — so the residual ships as a **single story `25-1`** (1-indexed per the story-numbering convention; no gaps).

## Acceptance Criteria

- [x] **All 6 Learn routes are data-driven gated** — `LearnRoutes.tsx` renders every content route through one `LearnRouteGate` that derives `label` + `requiredPhase` from `LEARN_NAV_ITEMS` via a `LEARN_ROUTE_CONFIG` keyed by route id (`foundations:1`, `radicals:2`, `grammar:2`, `phonetic:3`, `readers:3`, `chengyu:4`); no per-route hardcoded phase numbers remain.
- [x] **Radicals + phonetic-clusters URL bypass closed** — below-phase direct navigation to `/learn/radicals` and `/learn/phonetic-clusters` renders the `LockedSurface` gate screen (new route-gate tests `LearnRoutes.radicals.test.tsx` + `LearnRoutes.phonetic.test.tsx`).
- [x] **Gate screen replaces the silent redirect** — below-phase direct nav (guest or authed) on any higher-phase route renders the shared `LockedSurface` (neutral, CTA-free "Unlocks in Phase N."); the old redirect-to-foundations assertions in `LearnRoutes.grammar/chengyu.test.tsx` are updated to gate-screen assertions. Foundations (Phase 1) always renders for the guest/Phase-1 landing.
- [x] **Guest-shell UI (S1 + S2)** — `AppTopBar` gains a required `isGuest` prop that renders a compact passive `Badge variant="surface" data-testid="guest-identity-badge"` ("Guest", title "Browsing as a guest with Phase 1 access"); `AppLayout` wires `isGuest = !isAuthenticated || !!phaseGate?.isGuest`. No CTA/upsell (epic-26 NON-GOAL).
- [x] **Shared `LockedSurface` registered** — new shared component under `apps/frontend/src/shared/components/LockedSurface/` (composes `EmptyState` lock-icon treatment), barrel-exported from `shared/components`, registered in `.github/component-registry.json`, with MSW-mocked stories (default/edge).
- [x] **Absorbed-by-24-7 framing explicit** — Epic 25 does not re-implement the guest identity shape `{currentPhase: 1, isGuest: true}`; docs state it was landed by Epic 24 story 24-7 and is only consumed here.
- [x] **TTS guest-cost verification** — both `optionalAuth` surfaces (`POST /v1/tts`, `POST /v1/readers/passages/:id/audio`) verified **cache-first-free for guests** (guest `userId` undefined → never 401; cache HIT returns `{ cached: true }` with no billable generation); generated-audio quota mechanics recorded as epic-29's; no backend code change.
- [x] **Release gates green** — `tsc -b --noEmit` 0 errors; 8 affected test files / 18 tests pass (LearnRoutes grammar/chengyu/radicals/phonetic/guest.integration + AppTopBar + AppLayout.guest + LockedSurface); `check:registry-stories` 36/36; no NEW `design-audit` errors from the Epic-25 files; verification recorded in `verification-artifacts/epic-25-route-gating-verification.md`.

## Architecture Decisions

- Decision: **One data-driven route gate over a per-route hardcoded wrapper (ADR-25-A)**
  - Rationale: the old `PhaseGate` was redirect-only, hardcoded to grammar(2)/readers(3)/chengyu(4), and omitted radicals + phonetic-clusters entirely — the URL bypass. A single `LearnRouteGate` deriving `requiredPhase` from `LEARN_NAV_ITEMS` (the same constant the sidebar lock consumes) kills drift between the sidebar and the route gate and closes both bypasses at once.
  - Alternatives considered: extending the per-route hardcoded wrapper to radicals/phonetic (least change, but keeps phase numbers duplicated vs `learnNav.ts` — rejected); gating at the page level (duplicates per page, re-opens drift — rejected).
  - Implications: the route gate and sidebar lock can never disagree because they share `LEARN_NAV_ITEMS`; `LEARN_REQUIRED_PHASE` remains derived from the same array.

- Decision: **Locked-surface gate screen replaces the silent redirect-to-foundations (approved behavior change)**
  - Rationale: the calibrated plan (AC: "direct navigation … shows the gate screen") and the human-approved UIUX Step-1 design chose a neutral locked-surface over silently bouncing the learner to Foundations, so sidebar-locked and direct-URL-locked read as one system.
  - Alternatives considered: keeping redirect-to-foundations on top of the screen (rejected — the silent redirect hides _why_ a route is unavailable); redirecting only (rejected — that was the pre-change behavior that hid the bypass).
  - Implications: existing redirect assertions in the grammar/chengyu route-gate tests were updated to gate-screen assertions in the same change.

- Decision: **Passive identity badge, no CTA (S1 boundary)**
  - Rationale: the guest badge is an identity indicator, not a marketing surface; CTA/copy/value-moment is Epic 26's `GuestUpsell` scope (NON-GOAL).
  - Alternatives considered: reusing `GuestUpsell` (rejected — that is the epic-26 CTA pattern); a banner strip in `AppLayout` (the UIUX Step-1 design chose the compact `AppTopBar` placement — approved at the User Preview Gate).
  - Implications: `AppTopBar` stays auth-free (identity is threaded in via props from `AppLayout`); no feature/auth import in the shared component.

- Decision: **TTS cost-surface resolution is verification-only in Epic 25**
  - Rationale: OI-3 splits the TTS resolution — Epic 25 verifies the read/cache path is cache-first-free for guests (which surface actually generates on miss), and Epic 29 M2 builds the counter + quota via the unified L5 machinery. Building a TTS-only counter in Epic 25 would be throwaway once the quota spine lands.
  - Alternatives considered: flipping either surface to `requireAuth`/guest-gated now (not needed — both are already cache-first-free for guests); building a TTS-only counter here (rejected — throwaway vs Epic 29).
  - Implications: no backend code change; the residual risk recorded in OI-3 (if a surface is NOT cache-first, Epic 25 must flip it) is closed by the verification — both surfaces are cache-first-free for guests.

## Implementation Plan

1. **25-1** Data-driven Learn route gating on all 6 routes (`LearnRouteGate` + `LEARN_ROUTE_CONFIG`) + shared `LockedSurface` gate screen (S2) replacing the silent redirect → `AppTopBar` passive Guest badge (S1) + `AppLayout` `isGuest` wiring → route-gate/guest tests + stories + registry → TTS guest-cost verification (docs-only, no backend change) → epic BR/IMP + verification artifact + release gates.

**Gating summary:** no external gates. The epic is the first post-24 epic, lands on NestJS after Epic 24 completes (serial), and its residual is a single story. The merge PR is the epic's release gate, with the Code Reviewer verdict (this run) preceding the owner commit gate (COMMIT GATE — review-before-commit).

## Risks & mitigations

- Risk: Route-gate logic drifts from the sidebar lock logic (duplicated phase numbers) — Severity: **Medium**
  - Mitigation: single source of truth — `LearnRouteGate` derives `requiredPhase` from `LEARN_NAV_ITEMS`/`LEARN_REQUIRED_PHASE`; route-gate tests assert the locked surface on below-phase direct nav.
  - Rollback: n/a — data-driven by design (ADR-25-A).

- Risk: The silent redirect → gate-screen change regresses existing guest flows (grammar/chengyu tests asserted the redirect) — Severity: **Medium**
  - Mitigation: affected route-gate tests updated to gate-screen assertions in the same change; `LearnRoutes.guest.integration.test.tsx` asserts the Phase-1 shell (Foundations unlocked; direct higher-phase nav shows the gate screen); FE full-suite regression via the quality gates.
  - Rollback: revert the test + behavior change together (single commit).

- Risk: TTS surfaces are NOT actually cache-first-free for guests (the OI-3 residual-risk gate) — Severity: **High** (if it were true)
  - Mitigation: verification artifact consolidates the two-surface guest-safe verdict (guest cache HIT → 200 `{ cached: true }` with no generation; guest MISS allowed; never 401/5xx on the audio read path) against the Nest controllers + parity tests; no backend change was required.
  - Rollback: if a future audit finds a surface is not cache-first, Epic 25's verification story is the gate to flip it before Epic 29.

- Risk: Guest badge or gate screen accidentally ships with a CTA/upsell (scope bleed into Epic 26) — Severity: **Low**
  - Mitigation: `LockedSurface` test asserts NO button/link; the badge is `Badge variant="surface"` (passive); `GuestUpsell` untouched.
  - Rollback: remove the CTA in the same commit as the detection.

## Implementation notes

- Conventions: follow `docs/guides/conventions/frontend.md` and `docs/knowledge-base/practices/solid-principles.md`.
- The guest identity shape `{currentPhase: 1, isGuest: true}` is Epic 24's 24-7 work — do not re-implement it in Epic 25 (see [24-7 BR](../epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md)).
- Locked-surface copy is neutral and CTA-free by design ("X unlocks in Phase N"); the CTA / value-moment is Epic 26's `GuestUpsell` scope.
- Generated-audio quota mechanics (counter + quota) are Epic 29's — Epic 25 verifies the read/cache path only.
