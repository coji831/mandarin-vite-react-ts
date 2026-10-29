/**
 * AppLayout component
 *
 * Root layout for the entire application.
 *
 * Story 22.4: composes AppTopBar (account UserMenu) + SideNav (Learn group,
 * desktop-collapsible rail) + <main> Outlet. The sidebar is hidden
 * on /auth/* (standalone auth pages), but the TopBar + UserMenu remain so auth
 * pages are never a dead-end. Sidebar collapse state is persisted via
 * localStorage.
 *
 * Story 25-3 / A25: the shell renders chrome + <Outlet /> only and reads NO
 * phase for navigation — `usePhaseGate`/`effectivePhase` and the SideNav
 * `phaseGate`/`requiredPhase` props are gone. Guest state is Browse-only and
 * lives on the dashboard (`features/dashboard` DashboardGuest), never here:
 * chrome is inherited by every route, so a guest region in this file would
 * occupy Focus surfaces permanently. Don't add one.
 *
 * S2 (session = route, not modal): the app-wide HubModal is gone. The hub is a
 * standalone cross-page PEEK instead (rework-proposal §0): HubSheet is mounted
 * once here, portalled to <body>, so it floats above the top bar and over the
 * rail and the origin surface is never unmounted. It is a navigator, not a
 * session, so it changes no chrome and owns one history entry per open.
 *
 * Phase 2 (original note): Sidebar redesign — replaces top navbar with left
 * sidebar. Uses shared SideNav component for the sidebar.
 */
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { practices_page, progress_page } from "../constants/paths";
import { resolvePageMode, chromeForMode } from "../constants/pageChrome";
import { LEARN_NAV_ITEMS } from "../constants/learnNav";
import { AppTopBar, SideNav, type NavItem } from "shared/components";
// NOTE (deliberate exception): AppLayout (shared) imports from features for the
// two app-wide surfaces that MUST be mounted once at the shell — the account
// chrome from `features/auth` (`user`, `isAuthenticated`, `logout`) and the
// lexical hub peek sheet from `features/lexical-hub/components`. Post-A25
// (Story 25-3) the shell reads no phase, so sign-in state here is account chrome,
// not gating. Both shared → feature inversions are intentional and should NOT be
// refactored away by future audits (allowlisted in
// `scripts/check-module-boundaries.mjs`).
import { useAuth } from "features/auth";
import { HubSheet } from "features/lexical-hub/components";
import "./AppLayout.css";

export { AppLayout };

const SIDEBAR_COLLAPSE_KEY = "mandarin:sidebar-collapsed";

function AppLayout({ initialCollapsed }: { initialCollapsed?: boolean } = {}) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Sidebar collapse state (desktop rail) — persisted so the user's choice sticks.
  // `initialCollapsed` overrides the stored value (used by stories/tests).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (initialCollapsed !== undefined) return initialCollapsed;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // Storage unavailable — collapse still applies for this session.
      }
      return next;
    });
  };

  // Mode-aware chrome (dual-mode chrome law, page-archetypes.md §0): the mode
  // comes from the page's archetype, not per-page hacks. Focus = rail collapsed
  // + recessed top bar; Browse = rail expanded + standard top bar; auth = no rail
  // (the UserMenu top bar remains so auth pages are never a dead-end).
  const mode = resolvePageMode(location.pathname, location.search);
  const chrome = chromeForMode(mode);
  const isFocusMode = mode === "focus";

  // Don't show sidebar on auth pages — both login and register render standalone
  // (previously only login was hidden, so Register showed the nav when authed).
  const isAuthPage = mode === "auth";

  const navItems: NavItem[] = [
    { path: "/", label: "Dashboard", icon: "dashboard", exact: true },
    {
      path: "/learn",
      label: "Learn",
      icon: "learn",
      exact: false,
      children: LEARN_NAV_ITEMS,
    },
    { path: practices_page, label: "Practices", icon: "practice", exact: false },
    { path: "/library", label: "Library", icon: "book", exact: false },
    { path: progress_page, label: "Progress", icon: "progress", exact: false },
  ];

  return (
    <div className="app-layout flex">
      {!isAuthPage && (
        <SideNav
          navItems={navItems}
          currentPath={location.pathname}
          // Full location (pathname + search) so SideNav can apply the
          // same-path guard (Story 22.5) — preserves `?tab`/`?view` sub-state
          // on same-page sidebar clicks.
          location={{ pathname: location.pathname, search: location.search }}
          // Focus mode forces the collapsed icon rail (dual-mode chrome law);
          // Browse keeps the user's persisted collapse choice. The manual
          // collapse toggle is Browse-only — Focus chrome is fixed.
          collapsed={isFocusMode || collapsed}
          onToggleCollapse={isFocusMode ? undefined : handleToggleCollapse}
        />
      )}

      <div className="app-main flex flex-col flex-1">
        <AppTopBar
          user={user}
          isAuthenticated={isAuthenticated}
          logout={logout}
          variant={chrome.topbar === "recessed" ? "recessed" : "standard"}
        />
        <main className="app-content flex flex-col flex-1">
          <Outlet />
        </main>
      </div>
      {/* The hub peek lives OUTSIDE .app-content and portals to <body>: it must
          never be a child of a page's scroll container. */}
      <HubSheet />
    </div>
  );
}
