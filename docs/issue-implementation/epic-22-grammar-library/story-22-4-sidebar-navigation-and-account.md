# Implementation 22-4: Sidebar Navigation and Account

> **BR Reference:** `docs/business-requirements/epic-22-grammar-library/story-22-4-sidebar-navigation-and-account.md`
> **Last Updated:** August 5, 2026
> **Status:** ✅ Complete

## Technical Scope

Frontend-only restructure of the application shell. Moves the Learn tabs out of the `LearnLayout` `TopNav` tab bar into a phase-gated "Learn" group in `SideNav`, introduces the `UserMenu` + `AppTopBar` as the single account surface (fixing the collapsed-rail auth bug by construction), adds thin `/profile` and `/settings` placeholder pages, and adds two auth affordances (return-to-origin + authed-redirect off `/auth/*`). No backend/auth API changes.

**Files:**

- `apps/frontend/src/shared/constants/learnNav.ts` — **NEW**: single-source Learn tabs + `LEARN_REQUIRED_PHASE` map
- `apps/frontend/src/shared/constants/paths.ts` — update: add `profile_page`, `settings_page`
- `apps/frontend/src/shared/constants/index.ts` — update: re-export new path constants
- `apps/frontend/src/shared/components/UserMenu/UserMenu.tsx` — **NEW**: account control (avatar trigger + popover; guest Login/Register); auth-free — auth threaded in via props (review N1); popover is a disclosure-style `role="list"` (review N6)
- `apps/frontend/src/shared/components/UserMenu/UserMenu.css` — **NEW**
- `apps/frontend/src/shared/components/UserMenu/UserMenu.stories.tsx` — **NEW**
- `apps/frontend/src/shared/components/UserMenu/__tests__/UserMenu.test.tsx` — **NEW**
- `apps/frontend/src/shared/components/AppTopBar/AppTopBar.tsx` — **NEW**: slim top bar hosting `UserMenu`; auth passed through via props (review N1); no `leading` slot (review N4)
- `apps/frontend/src/shared/components/AppTopBar/AppTopBar.css` — **NEW**
- `apps/frontend/src/shared/components/AppTopBar/AppTopBar.stories.tsx` — **NEW**
- `apps/frontend/src/shared/components/AppTopBar/__tests__/AppTopBar.test.tsx` — **NEW** (review N8): smoke test (authed + guest)
- `apps/frontend/src/shared/components/SideNav/SideNav.tsx` — update: auth props out, `phaseGate`/`requiredPhase`/`collapsed`/`onToggleCollapse` in, Learn group (`onNavigate`/`mobile` dropped in review N4)
- `apps/frontend/src/shared/components/SideNav/SideNav.css` — update: remove auth chrome styles, add Learn group + collapsed rail styles (mobile-variant block removed in review N4)
- `apps/frontend/src/shared/components/SideNav/SideNav.stories.tsx` — update: new states (expanded/collapsed/Learn locks; `MobileDrawer` story removed in review N4)
- `apps/frontend/src/shared/components/SideNav/__tests__/SideNav.test.tsx` — **NEW**
- `apps/frontend/src/shared/components/index.tsx` — update: barrel add `UserMenu`/`AppTopBar`, re-export new `SideNav` types
- `apps/frontend/src/shared/layouts/LearnLayout.tsx` — update: remove `TopNav` tab bar
- `apps/frontend/src/shared/layouts/LearnLayout.css` — update: remove `learn-nav-bar` styles
- `apps/frontend/src/shared/layouts/LearnLayout.stories.tsx` — update: no tab bar, add default phase-gate handler
- `apps/frontend/src/shared/layouts/AppLayout.tsx` — update: compose `AppTopBar` + `SideNav` + Outlet + `HubModal`; collapse state (localStorage); `usePhaseGate`
- `apps/frontend/src/shared/layouts/AppLayout.css` — update: app-main column + top bar structure
- `apps/frontend/src/shared/layouts/AppLayout.stories.tsx` — update: collapsed-rail story, guest
- `apps/frontend/src/shared/layouts/__tests__/AppLayout.test.tsx` — update: mock `shared/hooks`; assert TopBar/UserMenu present, sidebar hidden on auth pages
- `apps/frontend/src/pages/ProfilePage.tsx` — **NEW**: thin placeholder
- `apps/frontend/src/pages/SettingsPage.tsx` — **NEW**: thin placeholder
- `apps/frontend/src/router/Router.tsx` — update: add `/profile`, `/settings` routes
- `apps/frontend/src/pages/LoginPage.tsx` — update: return-to-origin + authed-redirect
- `apps/frontend/src/pages/RegisterPage.tsx` — update: return-to-origin + authed-redirect
- `apps/frontend/src/pages/__tests__/LoginPage.test.tsx` — **NEW** (review N2): `from`-guard + dashboard fallback + authed-redirect
- `apps/frontend/src/pages/__tests__/RegisterPage.test.tsx` — **NEW** (review N2): `from`-guard + dashboard fallback + authed-redirect
- `apps/frontend/src/pages/LoginPageFull.stories.tsx` — update: authed-redirect state
- `apps/frontend/src/pages/RegisterPageFull.stories.tsx` — update: authed-redirect state
- `apps/frontend/.storybook/preview.tsx` — update: default phase-gate MSW handler so `usePhaseGate` in `AppLayout` resolves in all layout stories
- `apps/frontend/.storybook/decorators/withAppLayout.tsx` — update: docstring + default phase-gate handling
- `apps/frontend/.storybook/decorators/withLearnLayout.tsx` — update: docstring (nav-less `LearnLayout`)
- `.github/component-registry.json` — update: `SideNav` props; add `UserMenu`, `AppTopBar`
- `DESIGN.md` — update: add `UserMenu`/`AppTopBar` to component catalog
- `docs/business-requirements/epic-22-grammar-library/story-22-4-sidebar-navigation-and-account.md` — **NEW**: story BR
- `docs/issue-implementation/epic-22-grammar-library/story-22-4-sidebar-navigation-and-account.md` — **NEW**: this doc

## Implementation Details

### `learnNav.ts` — single source of Learn tabs + phase map

```typescript
import {
  learn_foundations,
  learn_radicals,
  learn_grammar,
  learn_phonetic_clusters,
  learn_readers,
  learn_chengyu,
} from "./paths";

export type LearnNavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPhase: number;
};

export const LEARN_NAV_ITEMS: LearnNavItem[] = [
  {
    id: "foundations",
    label: "Foundations",
    icon: "🔤",
    path: learn_foundations,
    requiredPhase: 1,
  },
  { id: "radicals", label: "Radicals", icon: "📘", path: learn_radicals, requiredPhase: 2 },
  { id: "grammar", label: "Grammar", icon: "📕", path: learn_grammar, requiredPhase: 2 },
  {
    id: "phonetic",
    label: "Phonetic",
    icon: "🔊",
    path: learn_phonetic_clusters,
    requiredPhase: 3,
  },
  { id: "readers", label: "Readers", icon: "📖", path: learn_readers, requiredPhase: 3 },
  { id: "chengyu", label: "Chengyu", icon: "🏮", path: learn_chengyu, requiredPhase: 4 },
];

export const LEARN_REQUIRED_PHASE: Record<string, number> = Object.fromEntries(
  LEARN_NAV_ITEMS.map((item) => [item.id, item.requiredPhase]),
);
```

### `SideNav` — nav-only + Learn group + rail

New contract:

```typescript
type NavItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  children?: LearnNavItem[]; // nested phase-gated group (Learn)
};

type SideNavProps = {
  navItems: NavItem[];
  currentPath: string;
  phaseGate?: number;
  requiredPhase?: (id: string) => number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};
```

- Auth section removed entirely — no `isAuthenticated`/`userName`/`onLogout`/`onLogin`.
- Learn group: when a top-level item has `children`, it renders as an expandable group (chevron toggle, default open); children are phase-gated via `requiredPhase(id) > phaseGate` (locked = 🔒, `aria-disabled`, non-navigable, title "Complete Phase N to unlock").
- Collapsed rail (`collapsed`): icons only — brand label, link labels, Learn children, and the collapse control's label are hidden via CSS; `onToggleCollapse` rendered as an icon button in the brand row.

### `UserMenu` — single account control (auth-free)

```typescript
export type UserMenuProps = {
  user: UserMenuUser | null;
  isAuthenticated: boolean;
  logout: () => Promise<void> | void;
};

export function UserMenu({ user, isAuthenticated, logout }: UserMenuProps) {
  // guest → Login (primary) + Register (secondary) buttons → login_page/register_page with state.from
  // authed → avatar trigger (aria-expanded) → role="list" disclosure popover:
  //   account header (avatar + name + email) · Profile (/profile) · Settings (/settings) · divider · Logout
}
```

- Auth is threaded in via props (`AppLayout` → `AppTopBar` → `UserMenu`) — `UserMenu` never imports `features/auth` (review N1).
- Popover is a disclosure-style `role="list"` of buttons (outside-click + Esc close; no arrow-key traversal claim) — review N6, built from `Button` — no new dependency.
- Logout: `await logout()` then `navigate("/")` (safe on failure — `AuthContext.logout` clears local state in `finally`).
- Guest Login/Register pass `location.state.from` = current path so `LoginPage`/`RegisterPage` can return the user to origin.

### `AppLayout` composition

```
.app-layout (flex row, height 100vh)
├── SideNav (220px | 64px rail)  [hidden on /auth/*]
└── .app-main (flex column, flex 1, min-width 0)
    ├── AppTopBar (slim, flex-shrink 0) → UserMenu
    └── main.app-content (flex 1, min-height 0, overflow-y auto) → <Outlet/>
( + HubModal at root, kept )
```

- Collapse state: `useState` initialized from `localStorage` (`mandarin:sidebar-collapsed`), persisted on toggle.
- `effectivePhase = isAuthenticated ? (phaseGate?.currentPhase ?? Infinity) : 4` via `usePhaseGate()` (moved from `LearnLayout`); `Infinity` (all unlocked) while the gate is in-flight/failed — review N7.
- `AppTopBar` receives `user`/`isAuthenticated`/`logout` from `useAuth()` at the `AppLayout` composition root and passes them to `UserMenu` (review N1).

## Architecture Integration

```
AppLayout ── useAuth() ──> user / isAuthenticated / logout
    │  └─ composes ──> AppTopBar ──(props)──> UserMenu (auth-free)
    │
    └── SideNav (Learn group, phase-gated) ──> learnNav.ts + usePhaseGate
    │
    └── main Outlet ──> LearnLayout (nav-less scroll container) ──> Learn pages
    │
    └── HubModal (LexicalHub overlay — kept, deliberate shared→feature inversion)
```

Depends on: Story 18.1 (phase-gate infra — `usePhaseGate` + `/v1/progression/phase-gate`), Story 14.3 (auth refresh/logout), Story 17.7 (routes), Story 22.3 (Grammar tab content). `TopNav` becomes orphaned after this story — kept in barrel/registry, removal flagged.

## Technical Challenges & Solutions

**Challenge: `usePhaseGate()` in `AppLayout` vs Storybook stories that don't set MSW handlers**

- **Problem**: `AppLayout` now needs the phase gate (to lock the sidebar Learn group). The existing `usePhaseGate()` hook fetches `/v1/progression/phase-gate` via `apiClient`. Layout stories relying on the global preview decorator don't set per-story MSW handlers, so the fetch would hit `onUnhandledRequest: "bypass"` and resolve to `phaseGate = null` → `currentPhase` defaults to 1 → Grammar (phase 2) would render locked in stories.
- **Root Cause**: The phase gate was previously only used inside `LearnLayout` (whose stories explicitly set `msw.handlers`), never by the app root.
- **Solution**: Add a default `msw: { handlers: [mswHandlers.progression.phaseGate(4)] }` to the global `preview.tsx` parameters so every layout story resolves the phase gate as "all unlocked" unless a story overrides it. `usePhaseGate` failures are still non-fatal (`.catch(() => setPhaseGate(null))`).
- **Impact/Benefits**: Layout stories stay deterministic; the gate is centralized; production behavior unchanged (real API).
- **Alternatives Considered**: Threading `phaseGate` through props from `AppLayout` to `SideNav` (chosen — the hook stays at the composition root); a Zustand phase store (rejected — unnecessary state duplication).

**Challenge: collapsed-rail auth bug (the reported bug)**

- **Problem**: In the 60px rail, the sidebar's guest Login button (`.btn-sm` min-width 100px) and the authed avatar/logout row overflow the rail and overlap; the `Box variant="divider"` container adds a stray border.
- **Root Cause**: The auth section lived in the sidebar with button min-widths and a bordered container that can't fit a 60px rail.
- **Solution**: Remove the auth section from `SideNav` entirely; the always-present `AppTopBar` `UserMenu` is the single account surface. The rail now carries only icons — no button, no border, no overlap (fixed by construction).
- **Impact/Benefits**: Bug eliminated in every mode (expanded, rail, and any future mobile drawer).

## Review Fixes (Code Reviewer Audit — N1–N8, Aug 5 2026)

The Code Reviewer audit returned **APPROVE-WITH-NITS** (0 blockers, 2 medium, 5 low, 1 nit). All findings were resolved in this commit:

- **N1 (medium)** — `UserMenu` no longer imports `features/auth` (shared → feature inversion removed beyond the documented `AppLayout` exception). Auth (`user`/`isAuthenticated`/`logout`) is threaded via props `AppLayout` → `AppTopBar` → `UserMenu`; both shared components are now auth-free. Behavior unchanged (guest = Login/Register CTAs with `state.from`; authed = avatar → Profile/Settings/Logout).
- **N2 (medium)** — Return-to-origin had no unit test. Added `LoginPage.test.tsx` + `RegisterPage.test.tsx`: render with `location.state = { from: "/learn/grammar" }` and assert the success path navigates there; assert dashboard fallback when `from` is `/auth/*` or absent; assert authed-redirect off `/auth/*`.
- **N3 (low)** — `router/LearnRoutes.tsx` stale "phase-gated tab bar" comment updated (tab bar removed; nav now in the sidebar Learn group).
- **N4 (low)** — Dropped speculative dead props never passed by `AppLayout`: `SideNav` `onNavigate`/`mobile` and `AppTopBar` `leading`. Prop types, `SideNav.css` (mobile-variant block), stories (incl. removed `MobileDrawer` story), tests, `component-registry.json`, and `DESIGN.md` updated.
- **N5 (low)** — `router/Router.tsx` now uses `profile_page`/`settings_page` path constants for `/profile`/`/settings` (matches sibling routes).
- **N6 (low)** — `UserMenu` popover switched from `role="menu"`/`menuitem` (which implied arrow-key navigation that wasn't implemented) to a disclosure-style `role="list"` of buttons — honest with the Enter/Space/Esc/outside-click keyboard model.
- **N7 (low)** — `AppLayout` `effectivePhase` now defaults to all-unlocked (`Infinity`) while the phase-gate fetch is in-flight or failed, instead of a misleading phase-1 lock app-wide. Covered by a new `AppLayout` test.
- **N8 (nit)** — Added `AppTopBar.test.tsx` smoke test (authed avatar + guest Login/Register) so every new shared component owns a test.

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` — no new endpoints this story (frontend-only); existing `progression.phaseGate` + `auth.refresh`/`auth.logout` used unchanged
- [x] Feature/module/component names verified against `apps/frontend/src/features/` and `apps/frontend/src/shared/` (`UserMenu`, `AppTopBar` under `shared/components/`; `learnNav.ts` under `shared/constants/`; `ProfilePage`/`SettingsPage` under `pages/`)
- [x] Data source matches backing service/repository — account state via `useAuth()` context; phase gating via `usePhaseGate()` (API); no new data source
- [x] All relative markdown links resolve (this BR + IMP twin, `../README.md` epic parent, `story-22-3-grammar-ui.md` related)
- [x] Last Updated / Last Update date is current (August 5, 2026 — same commit as the edit)

> **Note:** PR / Merge Date / Key Commit stay literal `TBD` until commit, filled same-commit; never merge with TBD.

## Testing Implementation

- **`UserMenu`** (component tests, `renderWithProviders`): guest renders Login/Register; authed renders avatar + name; opening the trigger shows Profile/Settings/Logout; Logout calls `logout` and navigates to `/`; Profile navigates to `/profile`; Esc and outside-click close the menu. Auth passed via props (review N1); `role="list"` assertions (review N6).
- **`AppTopBar`** (**NEW**, review N8): smoke test — renders the authed UserMenu (avatar trigger) and the guest UserMenu (Login/Register).
- **`SideNav`** (component tests, `MemoryRouter`): renders top-level items; renders Learn children; locked children show 🔒 + `aria-disabled` and clicking does not navigate (location-probe assertion); collapsed hides labels + Learn children and calls `onToggleCollapse`.
- **`AppLayout`** (updated): mocks `shared/hooks` (`usePhaseGate`); asserts sidebar hidden on `/auth/*`, present otherwise; asserts `AppTopBar`/`UserMenu` present on all routes; asserts the Learn group stays unlocked while the phase gate loads (review N7).
- **`LoginPage` / `RegisterPage`** (**NEW**, review N2): return-to-origin via `location.state.from`; dashboard fallback when `from` is absent or `/auth/*`; authed-redirect off `/auth/*`.
- Storybook: `test-storybook` runs every story (`UserMenu`, `AppTopBar`, `SideNav` states, `AppLayout`, `LearnLayout`, `LoginPageFull`, `RegisterPageFull`) as smoke tests.
- Manual browser verification at 320/768/1024 with evidence in `verification-artifacts/epic-22/` (before rail bug + after fix).

## Key Commits

- `6fdb51c9` — `feat(epic-22): implement story 22.4 sidebar navigation and account` (recorded in this `chore(docs)` commit, matching the 22.2/22.3 convention).
