---
purpose: A25 — remove the six Learn phase walls; guest state lives on the Browse dashboard, never in AppLayout
status: completed
last-verified: 2026-10-27
type: story
---

# Story 25.3: A25 Learn Un-Gating + Browse-Only Guest State

**Last Updated:** October 27, 2026

## Description

**As a** guest,
**I want to** reach every Learn surface directly by URL,
**So that** I can judge the whole product before I register — while the guest prompt I do see lives on the dashboard, not in my permanent chrome.

## Business Value

BM-1 §3 ratifies "Learn — all content (foundations → chengyu, all 4 stages) | ✅ browse/demo (**no
lock**)", and L6 ratifies the phase roadmap as "a priority scoring layer, **not a lock**; phase metadata
retained for sequencing". The pre-BM-1 build still walls **three** of the six Learn routes behind a
route-level `PhaseGate` — grammar (phase 2), readers (phase 3), chengyu (phase 4) — and the sidebar
blocks **five** of the six links outright (`preventDefault` + `aria-disabled`), including radicals and
phonetic-clusters, which have no route wall at all and are therefore unreachable from the navigation
(measured 2026-10-27: `router/LearnRoutes.tsx:62,71,79`; `shared/components/SideNav/SideNav.tsx:250-286`).
Every wall hides the product's strongest asset from exactly the visitor the demo funnel depends on, and
creates a second, contradictory source of truth about what a guest may see.

A25 also moves the guest-state region out of `AppLayout`: chrome is inherited by **every** route, so a
guest affordance there interrupts Focus surfaces permanently. The guest prompt belongs on the Browse
dashboard, which is where a guest actually lands and where the register CTA (epic-26) will attach.

## Acceptance Criteria

- [x] A guest navigating directly to each of the six Learn routes — `/learn/foundations`, `/learn/radicals`, `/learn/grammar`, `/learn/phonetic-clusters`, `/learn/readers`, `/learn/chengyu` — renders the page; no gate screen and no redirect. Verified by a route test per route (six assertions). The two existing wall tests (`LearnRoutes.grammar`, `LearnRoutes.chengyu`) are **inverted**, not deleted; the other four routes get new assertions. _Verified: `LearnRoutes.guestAtPhase1.test.tsx` covers foundations / radicals / phonetic-clusters / readers; `LearnRoutes.grammar` and `LearnRoutes.chengyu` are inverted in place. Each serves the calibrated Phase-1 gate through MSW and asserts the old redirect target is absent._
- [x] `router/LearnRoutes.tsx` no longer wraps any Learn route in a phase `PhaseGate`, and the local `PhaseGate` helper is removed (it has no other consumer). _Verified: the file contains no `PhaseGate` and no `usePhaseGate` import._
- [x] A guest can also **click through** the sidebar to every Learn item: no `preventDefault`, no `aria-disabled`, no `tabIndex={-1}` for phase reasons. Phase is presented as **metadata** (label/indicator) only — asserted by a SideNav interaction test that clicks each child at phase 1 and asserts the location changed. _Verified: `SideNav.test.tsx` "navigates to every Learn child at phase 1 (no preventDefault, no aria-disabled, no tabIndex=-1)", plus the tooltip-metadata and deep-linked-pill cases._
- [x] `LEARN_NAV_ITEMS[].phase` (renamed from `requiredPhase`) survives **only as sequencing metadata** — the doc comment states this explicitly (BM-1 L6 / A25) so a future contributor does not re-add a wall — and the derived `LEARN_REQUIRED_PHASE` map is **deleted** with its last consumers, because a surviving export named `REQUIRED` is the re-entry point for the wall this epic removed. `SideNav` holds **no** user-phase state: the `phaseGate`/`requiredPhase` props are deleted, not renamed-and-kept, and `AppLayout` stops reading the gate for navigation entirely. _Verified: `shared/constants/learnNav.ts` declares `phase: number` with the metadata-only doc and exports no `LEARN_REQUIRED_PHASE` (the barrel is clean too); `SideNav.tsx` has no phase prop; `AppLayout.tsx` has no `usePhaseGate`/`effectivePhase`._
- [x] `shared/layouts/AppLayout.tsx` renders chrome + `<Outlet />` only — a regression test asserts no guest banner/badge/persistent guest region is rendered for a guest. _Verified: `AppLayout.test.tsx` "renders chrome + `<Outlet />` only — no guest region, banner, or badge (A25)"._
- [x] The guest-state affordance remains on the Browse dashboard surface only (`features/dashboard` `DashboardGuest`), asserted by a dashboard test and reflected in its Storybook story. _Verified: `DashboardGuest.test.tsx` (ownership case) and the `DashboardPageFull` guest story._
- [x] The stale `verification-artifacts/epic-25-route-gating-verification.md` (it describes `LockedSurface`/`LEARN_ROUTE_CONFIG`/`LearnRouteGate`, none of which exist in `apps/frontend/src`) is corrected or marked superseded by A25, and `wip/guest-access-calibration.md` D5 ("radicals + phonetic get route gates — Decided") is annotated as superseded. _Verified in the worktree on 2026-10-27 — the artifact carries the SUPERSEDED banner at line 99 and the calibration note's D5 is annotated at line 694 — **but both files are gitignored/untracked, so neither banner is in the commit.** The durable supersession is the tracked `verification-artifacts/README.md` index row (marked SUPERSEDED), the [implementation's supersession record](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/story-25-3-learn-ungating-browse-guest-state.md) and the 15-row tripwire inventory. See the epic [implementation README](../../issue-implementation/epic-25-secure-guest-identity-and-route-gating/README.md) for the reasoning._
- [x] `ContentBrowser`'s second phase-lock map (`ContentBrowser.tsx:65-71`, inert today because `LibraryPage` passes `userPhase={4}`) is recorded as out-of-scope in the story impl doc rather than left as an undocumented wall. _Verified: comment-only tripwire added in the component; recorded in the impl doc's "Deliberately left alone" table._
- [x] No orphaned imports/exports left behind (`LEARN_REQUIRED_PHASE` consumers updated; `npm run build` passes). _Verified: `npm run build` passes; `LEARN_REQUIRED_PHASE` has no surviving consumer (only the explanatory doc comments in `learnNav.ts` mention it)._
- [x] Existing guest flows — browse, quiz attempt, review view — still function (frontend suite green). _Verified: full frontend suite 157 files / 1156 tests pass, storybook 64 files / 364 tests pass._

## Business Rules

1. **Learn = no lock.** Every Learn surface is reachable by every visitor; scarcity comes from session-local progress and demo quotas, not content walls (BM-1 §3, L5).
2. **Phase is a signal.** Phase metadata drives sequencing, labels and readiness messaging — never a navigation prerequisite (L6).
3. **Guest state is Browse-only.** No persistent guest affordance in the shared chrome; the dashboard owns guest messaging.

## Related Issues

- **Epic 25: Secure Guest Identity & Route Gating** _(link to `../epic-25-secure-guest-identity-and-route-gating/README.md`)_ (Parent)
- **Story 25.2: Guest Identity Lockstep** _(link to `story-25-2-guest-identity-lockstep.md`)_ (Dependency — supplies the guest gate the un-gated surfaces read)
- **Story 22.4: Sidebar Navigation** _(link to `../archive/epic-22-grammar-library/story-22-4-sidebar-navigation-and-account.md`)_ (Origin of the phase-gated Learn group; superseded for locking by A25)
- **Epic 26** (Guest CTA/copy + value-moment upgrade prompts) (Successor — owns the copy that attaches to the Browse guest surface)

## Implementation Status

- **Status**: Completed
- **PR**: #61
- **Merge Date**: pending merge (PR #61 open)
- **Key Commit**: `8f507c66` (feat(story-25-3): un-gate the Learn routes and move guest state out of the shell)
