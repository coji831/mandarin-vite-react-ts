/**
 * AppLayout component
 *
 * Root layout with left sidebar navigation for the entire application.
 * Provides global navigation: Dashboard, Learn, Practices, Library, Progress.
 * Sidebar fills full viewport height; page content renders beside it.
 *
 * Phase 2: Sidebar redesign — replaces top navbar with left sidebar.
 * Uses shared SideNav component for the sidebar.
 */
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { login_page, practices_page } from "../constants/paths";
import { SideNav, Modal } from "shared/components";
import { useAuth } from "features/auth";
import { LexicalHubRouter } from "features/lexical-hub/components";
import { useHubStore } from "shared/store";
import "./AppLayout.css";

export { AppLayout };

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

function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleLogin = () => {
    navigate(login_page);
  };

  // Don't show sidebar on auth page
  const isAuthPage = location.pathname.startsWith(login_page) || location.pathname === "/auth";

  const navItems = [
    { path: "/", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/learn", label: "Learn", icon: "📚", exact: false },
    { path: practices_page, label: "Practices", icon: "🎯", exact: false },
    { path: "/library", label: "Library", icon: "📖", exact: false },
    { path: "/progress", label: "Progress", icon: "📊", exact: false },
  ];

  return (
    <div className="app-layout flex">
      {!isAuthPage && (
        <SideNav
          navItems={navItems}
          currentPath={location.pathname}
          isAuthenticated={isAuthenticated}
          userName={user?.displayName || user?.email}
          onLogout={handleLogout}
          onLogin={handleLogin}
        />
      )}

      <main className="app-content flex flex-col flex-1">
        <Outlet />
      </main>
      <HubModal />
    </div>
  );
}
