# Story 22.4: Sidebar Navigation and Account

**Last Update:** August 5, 2026 (Story 22.4 scoped extension — frontend-only)

## Description

**As a** learner,
**I want to** reach every Learn section (Foundations, Radicals, Grammar, Phonetic, Readers, Chengyu) from the left sidebar and manage my account (Profile, Settings, Logout) from a top bar user menu,
**So that** navigation is unified in one place, the collapsed sidebar rail no longer breaks the login/logout controls, and I always have an account control regardless of screen width.

## Business Value

This story is a scope extension of Epic 22 (Grammar Pattern Library). It fixes a real layout bug — in the collapsed/mini rail mode the sidebar's login/logout controls overflow the ~60px rail (oversized button, stray container border, overlap with the user info) — and modernizes the application shell: the Learn tabs migrate out of the per-section `TopNav` tab bar into the sidebar as a phase-gated "Learn" group, and the account surface moves into an always-present `AppTopBar` `UserMenu`. This matches 2026 industry patterns (persistent/collapsible sidebar, grouped IA, single account control). It also adds thin `/profile` and `/settings` placeholder routes and fixes two auth affordances: login returns the user to the page they came from (`location.state.from`), and authenticated users are redirected away from `/auth/*`. Frontend-only — no backend or auth API changes.

## Acceptance Criteria

- [x] `shared/constants/learnNav.ts` created — single source of truth for the Learn section tabs and their `requiredPhase` map (foundations:1, radicals:2, grammar:2, phonetic:3, readers:3, chengyu:4); consumed by `AppLayout` (sidebar) so gating logic is not duplicated.
- [x] `SideNav` is auth-free: `isAuthenticated`/`userName`/`onLogout`/`onLogin` props removed; new props `phaseGate`, `requiredPhase`, `collapsed`, `onToggleCollapse` supported (review N4 dropped speculative `onNavigate`/`mobile`). Learn children render as a nested phase-gated group (locked items show 🔒 + title and are non-navigable); collapsed rail mode renders icons-only with no auth chrome, no border artifact, no overlap.
- [x] New shared `UserMenu` (avatar trigger + popover with account header, Profile, Settings, Logout; guest state = Login/Register) is the single login/user-info/logout surface, mounted in the new `AppTopBar` that is present on all routes (desktop-first, future-proof for mobile drawer). Auth is threaded in via props (`AppLayout` → `AppTopBar` → `UserMenu`) so both shared components stay auth-free (review N1); the popover is a disclosure-style `role="list"` of buttons, honest with the Enter/Space/Esc/outside-click keyboard model (review N6).
- [x] `AppLayout` composes `AppTopBar` + `SideNav` + `<main>` `<Outlet/>` + `HubModal` (HubModal kept); sidebar hidden on `/auth/*` as today; collapse state persisted via localStorage.
- [x] `LearnLayout` no longer renders the `TopNav` tab bar (tabs live in the sidebar Learn group); scroll container behavior preserved.
- [x] Thin placeholder `/profile` and `/settings` pages created with routes; `UserMenu` items navigate to them.
- [x] `LoginPage`/`RegisterPage` return to origin via `location.state.from` (fallback dashboard) and redirect authenticated users away from `/auth/*`; unit tests cover the `from`-guard success path and the dashboard fallback (review N2).
- [x] Barrel `shared/components/index.tsx`, `.github/component-registry.json`, and `DESIGN.md` updated together (UserMenu + AppTopBar added, SideNav props updated, TopNav kept and flagged for cleanup).
- [x] Storybook-first: `UserMenu`, `AppTopBar`, and the new `SideNav` states built in Storybook with MSW + `withAuth`/`withGuestAuth`; `AppLayout`/`LearnLayout`/`LoginPageFull`/`RegisterPageFull` stories updated; decorators/preview updated with a default phase-gate handler.
- [x] Tests updated/added (`UserMenu`, `AppTopBar`, `SideNav`, `AppLayout`, `LoginPage`, `RegisterPage`) per `testing-standards.instructions.md`; all quality gates pass (`npm run build`, `npm run lint` 0 errors, design lint, `npm run design-audit`, `npm run check:registry-stories`, `npm run test-storybook --workspace=@mandarin/frontend`, `npm test` changed scope).
- [x] Mini-rail bug verified fixed in the browser (no oversized button, no stray border around the user container, no overlap with user info); evidence saved in `verification-artifacts/`.

## Business Rules

1. **Single account surface** — `UserMenu` (in `AppTopBar`) is the only login/user-info/logout control; `SideNav` must not render auth chrome in any mode.
2. **Single-source phase gating** — the Learn `requiredPhase` map lives in `shared/constants/learnNav.ts` and is shared by the sidebar; `effectivePhase = isAuthenticated ? (phaseGate?.currentPhase ?? Infinity) : 4` — guests and authed users with an in-flight/failed gate default to all sections unlocked, so the sidebar never shows a misleading phase-1 lock (review N7).
3. **Shared component reuse** — build `UserMenu`/`AppTopBar`/`SideNav` from `Box`/`Button` and design tokens only; never hardcode colors/spacing/fonts; no new external menu dependency.
4. **Service layer only + auth-free shared components** — `UserMenu`/`AppTopBar` never call `apiClient` and never import `features/auth`; auth is threaded in via props from `AppLayout` (which owns the documented shared → feature inversion) — review N1. No new API surface.
5. **Barrels re-export only** — `shared/components/index.tsx` and `shared/constants/index.ts` only re-export; `learnNav.ts` is a constants file, not a barrel.
6. **Collapse persistence** — sidebar collapse state persists via localStorage (not a Zustand store); no stores created inside components/.
7. **`TopNav` stays** — `TopNav` remains in the barrel/registry this story (orphaned after the `LearnLayout` change); its removal is a flagged follow-up, not in scope.

## Related Issues

- Epic 22: Grammar Pattern Library — BR (`../README.md`) (epic parent)
- **Story 22.3: Grammar UI** ([BR](story-22-3-grammar-ui.md)) (related — Grammar tab is one of the migrated Learn sidebar items)

## Implementation Status

- **Status**: Complete
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `6fdb51c9`

## Implementation Notes (Code Review Fixes — Aug 5, 2026)

The Code Reviewer audit returned **APPROVE-WITH-NITS** (0 blockers, 2 medium, 5 low, 1 nit). All findings were resolved in this story's commit:

- **N1 (medium)** — `UserMenu` no longer imports `features/auth`; auth (`user`/`isAuthenticated`/`logout`) threaded via props `AppLayout` → `AppTopBar` → `UserMenu`. Behavior unchanged.
- **N2 (medium)** — Added `LoginPage.test.tsx` + `RegisterPage.test.tsx` covering return-to-origin (`from: /learn/grammar`), dashboard fallback (absent or `/auth/*` `from`), and authed-redirect.
- **N3 (low)** — `LearnRoutes.tsx` stale "phase-gated tab bar" comment updated (nav now lives in the sidebar Learn group).
- **N4 (low)** — Dropped speculative `SideNav` `onNavigate`/`mobile` props and `AppTopBar` `leading` slot; props, stories, tests, `component-registry.json`, `DESIGN.md`, and `SideNav.css` updated.
- **N5 (low)** — `Router.tsx` uses `profile_page`/`settings_page` path constants instead of literals.
- **N6 (low)** — `UserMenu` popover switched from `role="menu"`/`menuitem` to a disclosure-style `role="list"` of buttons.
- **N7 (low)** — `AppLayout` `effectivePhase` defaults to all-unlocked (`Infinity`) while the phase gate is in-flight/failed instead of a phase-1 lock; covered by a new `AppLayout` test.
- **N8 (nit)** — Added `AppTopBar.test.tsx` smoke test (authed + guest).

All gates re-run after the fixes pass (exit code 0) — see `verification-artifacts/story-22-4-gate-results.md`.
