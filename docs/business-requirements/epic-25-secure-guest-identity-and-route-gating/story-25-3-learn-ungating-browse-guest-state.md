---
purpose: A25 — remove the six Learn phase walls; guest state lives on the Browse dashboard, never in AppLayout
status: planned
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

- [ ] A guest navigating directly to each of the six Learn routes — `/learn/foundations`, `/learn/radicals`, `/learn/grammar`, `/learn/phonetic-clusters`, `/learn/readers`, `/learn/chengyu` — renders the page; no gate screen and no redirect. Verified by a route test per route (six assertions). The three existing wall tests (`LearnRoutes.grammar`, `LearnRoutes.chengyu`) are **inverted**, not deleted.
- [ ] `router/LearnRoutes.tsx` no longer wraps any Learn route in a phase `PhaseGate`, and the local `PhaseGate` helper is removed (it has no other consumer).
- [ ] A guest can also **click through** the sidebar to every Learn item: no `preventDefault`, no `aria-disabled`, no `tabIndex={-1}` for phase reasons. Phase is presented as **metadata** (label/indicator) only — asserted by a SideNav interaction test that clicks each child at phase 1 and asserts the location changed.
- [ ] `LEARN_REQUIRED_PHASE` / `LEARN_NAV_ITEMS[].requiredPhase` survive only as sequencing metadata — the doc comment states this explicitly (BM-1 L6 / A25) so a future contributor does not re-add a wall.
- [ ] `shared/layouts/AppLayout.tsx` renders chrome + `<Outlet />` only — a regression test asserts no guest banner/badge/persistent guest region is rendered for a guest.
- [ ] The guest-state affordance remains on the Browse dashboard surface only (`features/dashboard` `DashboardGuest`), asserted by a dashboard test and reflected in its Storybook story.
- [ ] The stale `verification-artifacts/epic-25-route-gating-verification.md` (it describes `LockedSurface`/`LEARN_ROUTE_CONFIG`/`LearnRouteGate`, none of which exist in `apps/frontend/src`) is corrected or marked superseded by A25, and `wip/guest-access-calibration.md` D5 ("radicals + phonetic get route gates — Decided") is annotated as superseded.
- [ ] `ContentBrowser`'s second phase-lock map (`ContentBrowser.tsx:65-71`, inert today because `LibraryPage` passes `userPhase={4}`) is recorded as out-of-scope in the story impl doc rather than left as an undocumented wall.
- [ ] No orphaned imports/exports left behind (`LEARN_REQUIRED_PHASE` consumers updated; `npm run build` passes).
- [ ] Existing guest flows — browse, quiz attempt, review view — still function (frontend suite green).

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

- **Status**: Planned
- **PR**: TBD (epic PR)
- **Merge Date**: TBD
- **Key Commit**: TBD
