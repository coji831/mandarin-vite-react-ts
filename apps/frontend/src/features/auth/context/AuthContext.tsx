/**
 * AuthContext - Manages authentication state and operations
 * Provides user data, login, register, logout, and token refresh functionality
 */

import { API_ENDPOINTS } from "@mandarin/shared-constants";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import type { AuthContextValue, LoginCredentials, RegisterData, User } from "../types";
import { clearLogoutHandler, setLogoutHandler } from "../utils/authFetch";
import { setLogoutCallback, clearLogoutCallback } from "../../../services/axiosClient";

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "accessToken";
const baseApiUrl = import.meta.env.VITE_API_URL;

// Fallback in case shared-constants not loaded
const AUTH_ME_ENDPOINT = baseApiUrl + (API_ENDPOINTS.AUTH_ME || "/api/v1/auth/me");

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
    try {
      console.log("[refreshTokens] Starting refresh...");
      const response = await fetch(baseApiUrl + API_ENDPOINTS.AUTH_REFRESH, {
        method: "POST",
        credentials: "include", // Send httpOnly cookie
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      const { accessToken } = data.data;

      console.log("[refreshTokens] Storing new accessToken:", accessToken.substring(0, 20) + "...");
      localStorage.setItem(TOKEN_KEY, accessToken);
      console.log(
        "[refreshTokens] Stored. Verifying:",
        localStorage.getItem(TOKEN_KEY)?.substring(0, 20) + "...",
      );
      return accessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      // If refresh fails, clear tokens
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      throw error;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount (React Strict Mode)

    const initAuth = async () => {
      console.log("[AuthContext] initAuth started");
      const accessToken = localStorage.getItem(TOKEN_KEY);
      console.log("[AuthContext] accessToken from storage:", accessToken ? "present" : "missing");

      // If no access token, try to refresh using httpOnly cookie
      if (!accessToken) {
        try {
          console.log("[AuthContext] Attempting refresh...");
          const newToken = await refreshTokens();
          console.log("[AuthContext] Refresh result:", newToken ? "success" : "failed");
          if (newToken && isMounted) {
            // Successfully refreshed, fetch user with new token
            const response = await fetch(AUTH_ME_ENDPOINT, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
              credentials: "include",
            });
            console.log("[AuthContext] /me response:", response.status);
            if (response.ok) {
              const data = await response.json();
              console.log("[AuthContext] Setting user:", data.data.user.email);
              if (isMounted) {
                setUser(data.data.user);
              }
            }
          }
        } catch (error) {
          console.error("Initial refresh failed:", error);
        } finally {
          console.log("[AuthContext] Setting isLoading to false");
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        // Fetch current user with the stored token
        const response = await fetch(AUTH_ME_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include", // Include httpOnly cookies
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (isMounted) {
              setUser(data.data.user);
            }
          } else {
            throw new Error("Backend not responding correctly");
          }
        } else if (response.status === 401) {
          // Token invalid or expired, try to refresh
          try {
            await refreshTokens();
            // Try fetching user again after refresh
            const retryResponse = await fetch(AUTH_ME_ENDPOINT, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
              },
              credentials: "include",
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              if (isMounted) {
                setUser(data.data.user);
              }
            } else {
              throw new Error("Session expired");
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            throw new Error("Session expired");
          }
        } else {
          throw new Error(`Unexpected response: ${response.status}`);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear invalid tokens
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
        console.log("[AuthContext] Background token refresh...");
        try {
          await refreshTokens();
        } catch (error) {
          console.error("[AuthContext] Background refresh failed:", error);
        }
      }
    }, REFRESH_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user, refreshTokens]);

  // Register logout handler for authFetch (legacy)
  useEffect(() => {
    const handleAutoLogout = () => {
      console.log("[AuthContext] Auto-logout triggered by authFetch");
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };

    setLogoutHandler(handleAutoLogout);

    return () => clearLogoutHandler();
  }, []);

  // Register logout callback for apiClient (Story 14.4)
  useEffect(() => {
    const handleApiClientLogout = () => {
      console.log("[AuthContext] Auto-logout triggered by apiClient");
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };

    setLogoutCallback(handleApiClientLogout);

    return () => clearLogoutCallback();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await fetch(baseApiUrl + API_ENDPOINTS.AUTH_LOGIN, {
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
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch(baseApiUrl + API_ENDPOINTS.AUTH_REGISTER, {
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
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch(baseApiUrl + API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        credentials: "include", // Send httpOnly cookie
      });
    } catch (error) {
      console.error("Logout error:", error);
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
