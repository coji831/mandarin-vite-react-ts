/**
 * RegisterPage - Authentication registration page
 * Split from AuthPage during frontend modulith migration
 *
 * Story 22.4: after a successful registration the user returns to the page
 * they came from (`location.state.from`, set by the UserMenu CTAs) with a
 * dashboard fallback; already-authenticated users are redirected off /auth/*.
 */
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { RegisterForm, useAuth } from "../features/auth";
import { auth_page, dashboard_page, login_page } from "shared/constants";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Authed users don't need the registration form — send them back into the app.
  if (isAuthenticated) {
    return <Navigate to={dashboard_page} replace />;
  }

  const handleSuccess = () => {
    const state = location.state as { from?: string } | null;
    const from = state?.from && !state.from.startsWith(auth_page) ? state.from : dashboard_page;
    navigate(from, { replace: true });
  };

  const handleSwitchToLogin = () => {
    navigate(login_page);
  };

  return (
    <div className="flex-center p-xl flex-1">
      <RegisterForm onSuccess={handleSuccess} onSwitchToLogin={handleSwitchToLogin} />
    </div>
  );
}
