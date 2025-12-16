/**
 * ProtectedRoute - Route wrapper that requires authentication
 * Redirects to auth page if user is not authenticated
 */

import { Navigate } from "react-router-dom";
import { auth_page } from "../../../constants/paths";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={auth_page} replace />;
  }

  return <>{children}</>;
}
