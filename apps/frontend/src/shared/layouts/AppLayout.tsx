/**
 * AppLayout component
 *
 * Root layout with unified navigation bar for the entire application.
 * Provides global navigation: Dashboard, Learn, Progress, and user menu.
 * Wraps all authenticated routes with consistent header and layout.
 *
 * Phase 2: Navigation redesign - replaces Root.tsx with modern two-level nav system
 */
import { Link, Outlet, useLocation } from "react-router-dom";

import { login_page, practices_page } from "../constants/paths";
import { useAuth } from "features/auth";
import { CharacterHub } from "features/character-hub/components";
import "./AppLayout.css";

export { AppLayout };

function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  // Don't show navbar on auth page
  const isAuthPage = location.pathname.startsWith(login_page) || location.pathname === "/auth";

  return (
    <div className="app-layout">
      {!isAuthPage && (
        <nav className="app-navbar">
          <div className="navbar-brand">
            <span className="navbar-logo">🏮</span>
            <span className="navbar-title">Mandarin</span>
          </div>

          {isAuthenticated && (
            <div className="navbar-links">
              <Link to="/" className={`navbar-link ${location.pathname === "/" ? "active" : ""}`}>
                🏠 Dashboard
              </Link>

              <Link
                to="/learn"
                className={`navbar-link ${location.pathname.startsWith("/learn") ? "active" : ""}`}
              >
                📚 Learn
              </Link>

              <Link
                to={practices_page}
                className={`navbar-link ${location.pathname.startsWith(practices_page) ? "active" : ""}`}
              >
                🎯 Practices
              </Link>

              <Link
                to="/library"
                className={`navbar-link ${location.pathname.startsWith("/library") ? "active" : ""}`}
              >
                📖 Library
              </Link>

              <Link
                to="/progress"
                className={`navbar-link ${location.pathname.startsWith("/progress") ? "active" : ""}`}
              >
                📊 Progress
              </Link>
            </div>
          )}

          <div className="navbar-user">
            {isAuthenticated ? (
              <>
                <span className="user-name">{user?.displayName || user?.email}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </>
            ) : (
              <Link to={login_page}>
                <button className="btn-login">Login</button>
              </Link>
            )}
          </div>
        </nav>
      )}

      <main className="app-content">
        <Outlet />
      </main>
      <CharacterHub />
    </div>
  );
}
