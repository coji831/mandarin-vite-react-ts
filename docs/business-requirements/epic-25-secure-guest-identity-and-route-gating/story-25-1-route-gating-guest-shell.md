**Last Updated:** September 5, 2026

# Story 25.1: Data-Driven Learn Route Gating + Guest-Shell UI + TTS Guest-Cost Verification

## Description

**As a** guest or below-phase learner,
**I want to** have every higher-phase Learn route protected by one data-driven phase gate that shows a neutral locked-surface screen on direct navigation (never the content, never a silent redirect), see a passive Guest identity badge in the shell, and have a verified cache-first-free TTS read path,
**So that** guest mode is safe and honest — the radicals/phonetic-clusters URL bypass is closed, sidebar-locked and direct-URL-locked read as one system, and guests are never silently bounced or surprised by a billable generation on the read path.

## Business Value

This is the residual Phase-A scope of Epic 25 after Epic 24's absorption of the guest-identity shape. Epic 24 story **24-7** already landed `createGuestPhaseGate → {currentPhase: 1, isGuest: true}` in `packages/shared-constants` (+ `PhaseGate.isGuest?: boolean` in `shared-types`) with the minimal FE lockstep — Epic 25 does **not** re-implement that shape; it consumes it. What remained was the **FE route-gating + guest-shell polish** and the **TTS cost-surface verification**:

1. **Route gating** — the old `PhaseGate` in `LearnRoutes.tsx` was redirect-only, hardcoded to grammar(2)/readers(3)/chengyu(4), and omitted radicals + phonetic-clusters entirely: below-phase direct navigation to `/learn/radicals` (Phase-2 content) or `/learn/phonetic-clusters` (Phase-3 content) rendered the content — an open URL bypass. A single data-driven `LearnRouteGate` (deriving `requiredPhase` from `LEARN_NAV_ITEMS`, the same constant the sidebar lock consumes) now covers all six routes and closes both bypasses.
2. **Guest-shell UI** — no guest identity indicator existed in the shell, and no locked-surface/gate-screen component existed anywhere. The story ships a compact passive Guest badge in `AppTopBar` (S1) and the shared `LockedSurface` gate screen (S2) that replaces the silent redirect-to-foundations on below-phase direct nav (guest or authed). Both are deliberately **CTA-free** — the CTA / value-moment is Epic 26's `GuestUpsell` (NON-GOAL).
3. **TTS guest-cost verification** — OI-3 splits the TTS resolution: Epic 25 verifies both `optionalAuth` surfaces (`POST /v1/tts`, passage-audio) are **cache-first-free for guests** (a cache HIT returns `{ cached: true }` with no billable Google TTS generation) and records that generated-audio quota mechanics are **epic-29's**. This is verification-only — **no backend code change** was required.

The story makes the guest demo honest (Phase 1 exactly, no accidental higher-phase content), closes a real content-gating hole, and de-risks Epic 29's quota work by confirming which TTS surface actually generates on miss.

## Acceptance Criteria

- [x] **Data-driven route gate on all 6 Learn routes** — `LearnRoutes.tsx` renders `foundations`/`radicals`/`grammar`/`phonetic`/`readers`/`chengyu` through one `LearnRouteGate`; each route's `label` + `requiredPhase` come from `LEARN_NAV_ITEMS` via a `LEARN_ROUTE_CONFIG` keyed by route id (`learnNav.ts` stays the single source of truth; `LEARN_REQUIRED_PHASE` remains derived from it). No per-route hardcoded phase numbers remain in the router.
- [x] **Radicals + phonetic-clusters URL bypass closed** — below-phase direct navigation to `/learn/radicals` and `/learn/phonetic-clusters` renders the `LockedSurface` gate screen, not the page content. Covered by the new `LearnRoutes.radicals.test.tsx` and `LearnRoutes.phonetic.test.tsx` route-gate tests.
- [x] **Locked-surface gate screen replaces the silent redirect** — below-phase direct nav (guest or authed) on any higher-phase route renders the shared `LockedSurface` (neutral, CTA-free: title = content label, description "Unlocks in Phase N."), and Foundations (Phase 1) always renders as the guest/Phase-1 landing. The old redirect-to-foundations assertions in `LearnRoutes.grammar.test.tsx` and `LearnRoutes.chengyu.test.tsx` are updated to gate-screen assertions (approved behavior change).
- [x] **Guest identity badge (S1)** — `AppTopBar` gains a required `isGuest` prop; when true it renders a compact passive `Badge variant="surface"` with `data-testid="guest-identity-badge"`, text "Guest", and title "Browsing as a guest with Phase 1 access". No CTA/upsell. `AppLayout` wires `isGuest = !isAuthenticated || !!phaseGate?.isGuest`.
- [x] **Shared `LockedSurface` component (S2)** — new presentational component under `apps/frontend/src/shared/components/LockedSurface/` (composes the shared `EmptyState` lock-icon treatment so sidebar-locked and direct-URL-locked read as one system), barrel-exported from `shared/components`, registered in `.github/component-registry.json` (props `label`, `requiredPhase`, `className`; story states default/edge), with MSW-mocked stories + component tests.
- [x] **Absorbed-by-24-7 framing** — the guest identity shape `{currentPhase: 1, isGuest: true}` was landed by Epic 24 story 24-7 (`createGuestPhaseGate`, `PhaseGate.isGuest?`, the `AppLayout` single-source `effectivePhase`, and `AppLayout.guest.integration.test.tsx`); Epic 25 does not re-implement it.
- [x] **TTS guest-cost verification (both `optionalAuth` surfaces)** — `POST /v1/tts` (`apps/backend/src/modules/audio/nest/audio-nest.controller.ts`) and `POST /v1/readers/passages/:id/audio` (`apps/backend/src/modules/readers/nest/readers-nest.controller.ts`) verified cache-first-free for guests: a guest's `userId` stays `undefined` (never 401), a cache HIT returns `{ cached: true }` with no billable generation, and generated-audio quota mechanics are recorded as **epic-29's**. No backend code change.
- [x] **Release gates green** — `tsc -b --noEmit` 0 errors; 8 affected test files / 18 tests pass (LearnRoutes grammar/chengyu/radicals/phonetic/guest.integration + AppTopBar + AppLayout.guest.integration + LockedSurface); `check:registry-stories` 36/36; no NEW `design-audit` errors from the Epic-25 files; verification recorded in `verification-artifacts/epic-25-route-gating-verification.md`.

## Business Rules

1. **Calibrated guest = exactly Phase 1** — the shell's `effectivePhase` consumes the Epic-24-24-7 `createGuestPhaseGate → {currentPhase: 1, isGuest: true}`; never an all-unlock, never a hardcoded `: 4` (removed in 24-7).
2. **The route gate and sidebar lock must never disagree** — both consume `LEARN_NAV_ITEMS` / `LEARN_REQUIRED_PHASE`; the route gate derives `requiredPhase` by route id instead of hardcoding it.
3. **Locked-surface copy is neutral and CTA-free** — "X unlocks in Phase N."; no register/upsell CTA (that is Epic 26's `GuestUpsell`). Applies to guest and authed below-phase navigation alike.
4. **Foundations is always accessible** — `/learn/foundations` (Phase 1) remains the guest/Phase-1 landing and never renders the gate screen.
5. **Guest badge is passive identity only** — compact `Badge`, no CTA/upsell, no value-moment copy (Epic 26).
6. **TTS read path is free for guests** — both `optionalAuth` surfaces are cache-first-free for guests; generated-audio quota mechanics are not implemented here (Epic 29 owns the counter + quota).
7. **No backend code change in this story** — the TTS verification is evidence-only against the Nest controllers/parity tests.
8. **`isGuest` is a required `AppTopBar` prop** — the shared component stays auth-free; `AppLayout` threads identity in via props.

## Related Issues

- **Epic 25: Secure Guest Identity & Route Gating** ([BR](README.md)) (epic parent)
- **Story 24.7: Guest Identity Calibration** ([BR](../epic-24-nestjs-shell-migration/story-24-7-guest-identity-calibration.md)) (prerequisite/absorbed — landed the `{currentPhase: 1, isGuest: true}` identity shape + FE lockstep that Epic 25 consumes; full guest-shell polish was explicitly left to Epic 25)
- **Story 24.10: Audio + Health Port** ([BR](../epic-24-nestjs-shell-migration/story-24-10-audio-health-port.md)) (related — absorbed Epic-25 F5 TTS surface; calibrated `optionalAuth` + cache-first-free-for-guests verified in-port)
- **Story 24.12: Readers Port** ([BR](../epic-24-nestjs-shell-migration/story-24-12-readers-port.md)) (related — absorbed Epic-25 F5 passage-audio; calibrated `optionalAuth` + 5/day DB-backed rate-limit)
- **Epic 26: Practice Calibration** (consumer — the guest CTA/copy + value-moment `GuestUpsell`; NON-GOAL here)
- **Epic 29: AI Gateway + Cost Governance** (consumer — generated-TTS quota mechanics / demo-quota counters; NON-GOAL here, recorded in the verification artifact)
- **Implementation (IMP twin):** `story-25-1-route-gating-guest-shell.md` → `../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-1-route-gating-guest-shell.md`

## Implementation Status

- **Status**: Completed (implementation + tests + docs in the working tree on `solar-v5-wire`; final merge pending Code Reviewer verdict + owner commit gate)
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD (filled at commit time)
