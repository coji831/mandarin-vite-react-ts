/**
 * ProtectedRoute - Route wrapper that requires authentication
 * Redirects to auth page if user is not authenticated
 */

import { Navigate } from "react-router-dom";
import { login_page } from "../../../shared/constants/paths";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "shared/components";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={login_page} replace />;
  }

  return <>{children}</>;
}
