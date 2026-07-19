/**
 * SideNav component
 *
 * Reusable left sidebar navigation extracted from AppLayout.
 * Supports authenticated (with user info + logout) and unauthenticated (login link) states.
 * Highlights active nav item using React Router's NavLink (isActive callback).
 */

import { NavLink } from "react-router-dom";
import { Box, Button } from "shared/components";
import "./SideNav.css";

export { SideNav };
export type { NavItem, SideNavProps };

type NavItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
};

type SideNavProps = {
  navItems: NavItem[];
  currentPath: string;
  isAuthenticated: boolean;
  userName?: string;
  onLogout: () => void;
  onLogin: () => void;
};

function SideNav({ navItems, isAuthenticated, userName, onLogout, onLogin }: SideNavProps) {
  return (
    <aside className="side-nav flex flex-col shrink-0 gap-xl bg-surface-dark p-md border-1 border-surface">
      {/* Brand */}
      <div className="side-nav__brand gap-xs font-lg fw-700 p-xs">
        <span className="side-nav__logo font-2xl" aria-hidden="true">
          🏮
        </span>
        <span className="side-nav__title text-accent">Mandarin</span>
      </div>

      {/* Navigation links — always visible */}
      <nav className="side-nav__links flex flex-col" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `side-nav__link gap-sm radius-sm text-tertiary font-sm p-sm transition-all ${isActive ? "fw-600 bg-primary-bg border-primary-border text-primary-light" : ""}`
            }
          >
            <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            <span className="side-nav__label whitespace-nowrap overflow-hidden">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section — pushed to bottom */}
      <Box variant="divider" className="side-nav__user gap-sm flex-wrap" padding="sm">
        {isAuthenticated ? (
          <>
            <Box className="side-nav__user-avatar bg-surface-light-20 radius-full flex-center font-xs text-tertiary shrink-0">
              {(userName || "U").charAt(0).toUpperCase()}
            </Box>
            <span className="side-nav__user-name font-sm text-secondary whitespace-nowrap overflow-hidden flex-1">
              {userName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="side-nav__logout text-tertiary"
              title="Logout"
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onLogin}
            className="side-nav__login bg-primary radius-sm"
          >
            Login
          </Button>
        )}
      </Box>
    </aside>
  );
}
