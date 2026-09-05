/**
 * AppTopBar — Slim global top bar hosting the account control (UserMenu).
 *
 * Story 22.4: the UserMenu lives here so the single login / user-info /
 * logout surface is always reachable at every breakpoint (desktop, collapsed
 * rail, and any future mobile drawer).
 *
 * Review N1: auth is threaded in via props (AppLayout → AppTopBar → UserMenu)
 * so this shared component stays auth-free — no `features/auth` import.
 *
 * Epic 25 S1: when `isGuest`, a compact passive "Guest" badge renders next to
 * the account controls. It is an identity indicator only — NO CTA/upsell
 * (GuestUpsell = epic-26, out). AppLayout derives `isGuest` from
 * `!isAuthenticated` / `usePhaseGate().phaseGate.isGuest`.
 */
import { Badge } from "../Badge/Badge";
import { UserMenu, type UserMenuUser } from "../UserMenu/UserMenu";
import "./AppTopBar.css";

export type AppTopBarProps = {
  /** Currently authenticated user (null for guests). */
  user: UserMenuUser | null;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /** Whether the session is a guest (drives the passive Guest identity badge). */
  isGuest: boolean;
  /** Logout handler from the auth context. */
  logout: () => Promise<void> | void;
  className?: string;
};

export function AppTopBar({
  user,
  isAuthenticated,
  isGuest,
  logout,
  className = "",
}: AppTopBarProps) {
  return (
    <header className={`app-top-bar flex items-center ${className}`.trim()}>
      <div className="app-top-bar__spacer flex-1" aria-hidden="true" />
      {isGuest && (
        <Badge
          variant="surface"
          data-testid="guest-identity-badge"
          title="Browsing as a guest with Phase 1 access"
        >
          Guest
        </Badge>
      )}
      <UserMenu user={user} isAuthenticated={isAuthenticated} logout={logout} />
    </header>
  );
}
