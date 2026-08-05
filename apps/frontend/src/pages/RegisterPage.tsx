/**
 * RegisterPage - Authentication registration page
 * Split from AuthPage during frontend modulith migration
 *
 * Story 22.4: after a successful registration the user returns to the page
 * they came from (`location.state.from`, set by the UserMenu CTAs) with a
 * dashboard fallback; already-authenticated users are redirected off /auth/*.
 *
 * Story 22.4 follow-up (Issue 1): single effect-driven navigation. The old
 * render-level `<Navigate>` raced the success handler's imperative
 * `navigate(from)` — whichever `replace` landed last won, silently dumping
 * users on the dashboard. Now ONE effect owns all "leave when authed"
 * navigation, keyed on the `isAuthenticated` transition:
 *   - guest register → `setUser` flips `isAuthenticated` → effect → `navigate(from)`
 *   - already-authed visit → effect on mount → `navigate(from ?? dashboard)`
 * `from` is sanitized to same-origin relative paths and forwarded across the
 * Register ⇄ Login switch so `from` survives switching forms.
 */
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RegisterForm, useAuth } from "../features/auth";
import { auth_page, dashboard_page, login_page } from "shared/constants";

/**
 * Sanitize `location.state.from` to a same-origin relative path.
 * Rejects non-relative values (`//host`, `http://…`) and auth paths so we
 * never bounce users back into the auth flow or to an external host.
 */
function resolveFrom(state: unknown): string {
  const candidate = (state as { from?: string } | null)?.from;
  if (
    candidate &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith(auth_page)
  ) {
    return candidate;
  }
  return dashboard_page;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const from = useMemo(() => resolveFrom(location.state), [location.state]);

  // ONE navigation for both "already authed" and "just became authed".
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  // No form flash frame while authed — the effect above owns the redirect.
  if (isAuthenticated) return null;

  // Forward `location.state` (carries `from`) so Login can honor it.
  const handleSwitchToLogin = () => navigate(login_page, { state: location.state });

  return (
    <div className="flex-center p-xl flex-1">
      <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
}
