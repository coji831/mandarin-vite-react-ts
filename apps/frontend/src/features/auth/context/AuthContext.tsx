/**
 * AuthContext - Manages authentication state and operations
 * Provides user data, login, register, logout, and token refresh functionality
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { API_CONFIG } from "config";
import { clearLogoutCallback, requestAccessToken, setLogoutCallback } from "services";
import type { AuthContextValue, LoginCredentials, RegisterData, User } from "../types";
import { authService } from "../services";

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "accessToken";
const baseApiUrl = API_CONFIG.baseURL;

// Helper to decode JWT and check if expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    // Consider token expired 30 seconds before actual expiry (buffer)
    return expiryTime - 30000 < now;
  } catch {
    return true; // Invalid token format, consider expired
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTokens = useCallback(async () => {
    // Delegate to the shared single-flight refresh (`requestAccessToken` in
    // axiosClient) so bootstrap, the axios interceptor, and background refresh
    // all share ONE in-flight promise. The backend ROTATES (revokes) the
    // refresh cookie on every use, so two concurrent refreshes with the same
    // cookie would otherwise fail 401 INVALID_TOKEN and wrongly log the user
    // out (F4).
    //
    // Failure side effects (localStorage token removal + setUser(null) via the
    // registered logout callback) happen exactly once inside
    // requestAccessToken — never duplicated here.
    return requestAccessToken();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount (React Strict Mode)

    const initAuth = async () => {
      const accessToken = localStorage.getItem(TOKEN_KEY);

      // If no access token, try to refresh using httpOnly cookie.
      // The shared single-flight dedupe collapses StrictMode's double-mount
      // into ONE /auth/refresh (guest: single non-fatal 400 MISSING_TOKEN).
      if (!accessToken) {
        try {
          const newToken = await refreshTokens();
          if (newToken && isMounted) {
            // Successfully refreshed, fetch user with new token
            const user = await authService.getCurrentUser();
            if (isMounted) {
              setUser(user);
            }
          }
        } catch {
          // Initial refresh failed — handled by isLoading=false below
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        // Fetch current user with the stored token. The axios response
        // interceptor transparently refreshes + retries once on 401 / 403
        // INVALID_TOKEN (expired/tampered), reusing the shared single-flight
        // refresh — so a resolution here means the session was restored (F4).
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setUser(user);
        }
      } catch {
        // Refresh failed — the shared refresh already cleared the token and
        // user (via the logout callback). Just ensure no stale local token.
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false; // Cleanup: prevent state updates after unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - refreshTokens is stable (useCallback)

  // Background token refresh: check every 5 minutes and refresh if needed
  useEffect(() => {
    if (!user) return; // Only run when authenticated

    const REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const intervalId = setInterval(async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && isTokenExpired(token)) {
        try {
          await refreshTokens();
        } catch {
          // Background refresh failed — will retry next interval
        }
      }
    }, REFRESH_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, refreshTokens]);

  // Register logout callback for apiClient (Story 14.3)
  useEffect(() => {
    const handleApiClientLogout = () => {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };

    setLogoutCallback(handleApiClientLogout);

    return () => clearLogoutCallback();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(baseApiUrl + ROUTE_PATTERNS.authLogin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include", // Include httpOnly cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      const { user: userData, accessToken } = data.data;

      localStorage.setItem(TOKEN_KEY, accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch(baseApiUrl + ROUTE_PATTERNS.authRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include", // Include httpOnly cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const responseData = await response.json();
      const { user: userData, accessToken } = responseData.data;

      localStorage.setItem(TOKEN_KEY, accessToken);
      setUser(userData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch(baseApiUrl + ROUTE_PATTERNS.authLogout, {
        method: "POST",
        credentials: "include", // Send httpOnly cookie
      });
    } catch {
      // Logout failed — still clear local state
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshTokens,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
