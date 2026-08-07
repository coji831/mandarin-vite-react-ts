/**
 * UserMenu — Single account control (login / user-info / logout surface).
 *
 * Story 22.4: the account surface moved out of the SideNav into the
 * always-present AppTopBar so it is reachable at every breakpoint (desktop,
 * collapsed rail, and any future mobile drawer). It is the ONLY place the
 * app renders login / user info / logout.
 *
 * - Authed: avatar (first letter) + short name + chevron trigger
 *   (`aria-expanded`). Popover shows the account header, Profile, Settings,
 *   and Logout.
 * - Guest: Login (primary) + Register (secondary) buttons. Both carry
 *   `location.state.from` so LoginPage/RegisterPage can return the user to
 *   the page they were on.
 *
 * Review N1: auth is threaded in via props (AppLayout → AppTopBar → UserMenu)
 * so this shared component stays auth-free — it never imports `features/auth`
 * or `apiClient`.
 *
 * Popover follows the shared Dropdown interaction pattern (outside-click +
 * Esc close) using a disclosure-style `role="list"` of buttons — honest with
 * the implemented keyboard model (Enter/Space toggle, Esc/outside-click
 * close; no arrow-key traversal). Built from shared Button/Box + design
 * tokens. No new menu dependency.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "shared/components";
import {
  dashboard_page,
  login_page,
  profile_page,
  register_page,
  settings_page,
} from "shared/constants";
import "./UserMenu.css";

export type UserMenuUser = {
  id: string;
  email?: string | null;
  displayName?: string | null;
};

export type UserMenuProps = {
  /** Currently authenticated user (null for guests). */
  user: UserMenuUser | null;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Logout handler from the auth context. */
  logout: () => Promise<void> | void;
};

export function UserMenu({ user, isAuthenticated, logout }: UserMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  // Guest CTA: carry the current path so login/register return the user to origin.
  const goToAuth = useCallback(
    (path: string) => {
      navigate(path, { state: { from: location.pathname + location.search } });
    },
    [navigate, location.pathname, location.search],
  );

  const handleNavigate = useCallback(
    (path: string) => {
      setIsOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await logout();
    navigate(dashboard_page);
  }, [logout, navigate]);

  // ── Guest state: Login / Register CTAs ──────────────────────────────
  if (!isAuthenticated || !user) {
    return (
      <div
        className="user-menu user-menu--guest flex items-center gap-sm"
        data-testid="user-menu-guest"
      >
        <Button variant="primary" size="sm" onClick={() => goToAuth(login_page)}>
          Login
        </Button>
        <Button variant="secondary" size="sm" onClick={() => goToAuth(register_page)}>
          Register
        </Button>
      </div>
    );
  }

  // ── Authed state: avatar trigger + popover ──────────────────────────
  const displayName = user.displayName || user.email || "";
  const shortName = user.displayName || (user.email ?? "U").split("@")[0];
  const avatarLetter = (shortName || "U").charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="user-menu relative" data-testid="user-menu-authed">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-controls="user-menu-popover"
        aria-label={`Account menu for ${displayName}`}
        className="user-menu__trigger flex items-center gap-xs"
      >
        <span
          className="user-menu__avatar bg-surface-light-20 radius-full flex-center font-xs text-tertiary shrink-0"
          aria-hidden="true"
        >
          {avatarLetter}
        </span>
        <span className="user-menu__name font-sm text-secondary whitespace-nowrap overflow-hidden">
          {shortName}
        </span>
        <span
          className={`user-menu__chevron font-xs text-muted lh-1 ${isOpen ? "user-menu__chevron--open" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </Button>

      {isOpen && (
        <ul
          id="user-menu-popover"
          className="user-menu__popover flex flex-col bg-surface-dark-alt"
          role="list"
          aria-label="User menu"
        >
          <li role="listitem" className="user-menu__header flex items-center gap-sm p-sm">
            <span
              className="user-menu__avatar bg-surface-light-20 radius-full flex-center font-xs text-tertiary shrink-0"
              aria-hidden="true"
            >
              {avatarLetter}
            </span>
            <div className="user-menu__identity flex flex-col overflow-hidden">
              <span className="user-menu__truncate font-sm fw-600 text-secondary whitespace-nowrap overflow-hidden">
                {displayName}
              </span>
              {user.email && (
                <span className="user-menu__truncate font-xs text-muted whitespace-nowrap overflow-hidden">
                  {user.email}
                </span>
              )}
            </div>
          </li>

          <li role="listitem" aria-hidden="true" className="user-menu__divider" />

          <li role="listitem" className="user-menu__action">
            <Button
              variant="ghost"
              size="sm"
              className="user-menu__item justify-start"
              onClick={() => handleNavigate(profile_page)}
            >
              Profile
            </Button>
          </li>
          <li role="listitem" className="user-menu__action">
            <Button
              variant="ghost"
              size="sm"
              className="user-menu__item justify-start"
              onClick={() => handleNavigate(settings_page)}
            >
              Settings
            </Button>
          </li>

          <li role="listitem" aria-hidden="true" className="user-menu__divider" />

          <li role="listitem" className="user-menu__action">
            <Button
              variant="ghost"
              size="sm"
              className="user-menu__item user-menu__item--logout justify-start text-error"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
