/**
 * AppTopBar — Slim global top bar hosting the account control (UserMenu).
 *
 * Story 22.4: the UserMenu lives here so the single login / user-info /
 * logout surface is always reachable at every breakpoint (desktop, collapsed
 * rail, and any future mobile drawer).
 *
 * Review N1: auth is threaded in via props (AppLayout → AppTopBar → UserMenu)
 * so this shared component stays auth-free — no `features/auth` import.
 */
import { UserMenu, type UserMenuUser } from "../UserMenu/UserMenu";
import "./AppTopBar.css";

export type AppTopBarProps = {
  /** Currently authenticated user (null for guests). */
  user: UserMenuUser | null;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Logout handler from the auth context. */
  logout: () => Promise<void> | void;
  className?: string;
};

export function AppTopBar({ user, isAuthenticated, logout, className = "" }: AppTopBarProps) {
  return (
    <header className={`app-top-bar flex items-center ${className}`.trim()}>
      <div className="app-top-bar__spacer flex-1" aria-hidden="true" />
      <UserMenu user={user} isAuthenticated={isAuthenticated} logout={logout} />
    </header>
  );
}
