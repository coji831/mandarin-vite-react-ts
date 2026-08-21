/**
 * AppLayout component
 *
 * Root layout for the entire application.
 *
 * Story 22.4: composes AppTopBar (account UserMenu) + SideNav (phase-gated
 * Learn group, desktop-collapsible rail) + <main> Outlet + HubModal. The
 * sidebar is hidden on /auth/* (standalone auth pages), but the TopBar +
 * UserMenu remain so auth pages are never a dead-end. Sidebar collapse state
 * is persisted via localStorage.
 *
 * Phase 2 (original note): Sidebar redesign — replaces top navbar with left
 * sidebar. Uses shared SideNav component for the sidebar.
 */
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { auth_page, practices_page, progress_page } from "../constants/paths";
import { LEARN_NAV_ITEMS, LEARN_REQUIRED_PHASE } from "../constants/learnNav";
import { AppTopBar, SideNav, Modal, type NavItem } from "shared/components";
// NOTE (deliberate exception): AppLayout (shared) imports from features/auth and
// features/lexical-hub to orchestrate the app-wide HubModal and phase gating —
// these overlays/gates must be mounted at the app root so they work everywhere.
// This shared → feature inversion is intentional and should NOT be refactored
// away by future audits.
import { useAuth } from "features/auth";
import { usePhaseGate } from "shared/hooks";
import { LexicalHubRouter } from "features/lexical-hub/components";
import { useHubStore } from "shared/store";
import "./AppLayout.css";

export { AppLayout };

const SIDEBAR_COLLAPSE_KEY = "mandarin:sidebar-collapsed";

function HubModal() {
  const { isOpen, currentEntity, close } = useHubStore();

  return (
    <Modal isOpen={isOpen} onClose={close} size="lg" title={currentEntity?.label ?? "Detail"}>
      {/*
       * LexicalHubRouter reads currentEntity from hubStore directly.
       * No props needed — Storybook stories pass props for testing.
       */}
      <LexicalHubRouter />
    </Modal>
  );
}

function AppLayout({ initialCollapsed }: { initialCollapsed?: boolean } = {}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { phaseGate } = usePhaseGate();
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

  // Phase gate for the sidebar Learn group (moved from LearnLayout). Calibrated
  // guest identity (Story 24-7): guests unlock exactly Phase 1 — the backend
  // returns `createGuestPhaseGate()` → `{currentPhase: 1, isGuest: true}`, so
  // the shell consumes that single source instead of a hardcoded `: 4`
  // all-unlock. Review N7: while the gate fetch is in-flight or failed
  // (`phaseGate` is null), default authed users to "all unlocked" (Infinity)
  // instead of a misleading phase-1 lock app-wide — but guests stay Phase 1,
  // never all-unlocked.
  const effectivePhase = phaseGate?.currentPhase ?? (isAuthenticated ? Infinity : 1);

  // Don't show sidebar on auth pages — both login and register render standalone
  // (previously only login was hidden, so Register showed the nav when authed).
  const isAuthPage = location.pathname.startsWith(auth_page);

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
          phaseGate={effectivePhase}
          requiredPhase={(id) => LEARN_REQUIRED_PHASE[id] ?? 1}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      )}

      <div className="app-main flex flex-col flex-1">
        <AppTopBar user={user} isAuthenticated={isAuthenticated} logout={logout} />
        <main className="app-content flex flex-col flex-1">
          <Outlet />
        </main>
      </div>
      <HubModal />
    </div>
  );
}
