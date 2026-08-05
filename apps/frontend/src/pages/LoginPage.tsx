/**
 * LoginPage - Authentication login page
 * Split from AuthPage during frontend modulith migration
 *
 * Story 22.4: after a successful login the user returns to the page they came
 * from (`location.state.from`, set by the UserMenu Login/Register CTAs) with a
 * dashboard fallback; already-authenticated users are redirected off /auth/*.
 */
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LoginForm, useAuth } from "../features/auth";
import { auth_page, dashboard_page, register_page } from "shared/constants";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Authed users don't need the login form — send them back into the app.
  if (isAuthenticated) {
    return <Navigate to={dashboard_page} replace />;
  }

  const handleSuccess = () => {
    const state = location.state as { from?: string } | null;
    const from = state?.from && !state.from.startsWith(auth_page) ? state.from : dashboard_page;
    navigate(from, { replace: true });
  };

  const handleSwitchToRegister = () => {
    navigate(register_page);
  };

  return (
    <div className="flex-center p-xl flex-1">
      <LoginForm onSuccess={handleSuccess} onSwitchToRegister={handleSwitchToRegister} />
    </div>
  );
}
