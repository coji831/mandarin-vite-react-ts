/**
 * @file authFetch.ts
 * @description Authenticated fetch wrapper with automatic token refresh
 * Implements request interceptor pattern for seamless token management
 */

import { API_ENDPOINTS } from "@mandarin/shared-constants";

const TOKEN_KEY = "accessToken";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

let refreshPromise: Promise<string> | null = null;
let onLogout: (() => void) | null = null;

// Helper to decode JWT and check if expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    // Buffer: refresh 30 seconds before actual expiry
    return expiryTime - 30000 < now;
  } catch {
    return true;
  }
}

// Refresh access token using httpOnly cookie
async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log("[authFetch] Refreshing access token...");
      const response = await fetch(API_BASE + API_ENDPOINTS.AUTH_REFRESH, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      const { accessToken } = data.data;

      localStorage.setItem(TOKEN_KEY, accessToken);
      console.log("[authFetch] Token refreshed successfully");
      return accessToken;
    } catch (error) {
      console.error("[authFetch] Token refresh failed:", error);
      localStorage.removeItem(TOKEN_KEY);
      // Trigger logout in AuthContext
      if (onLogout) {
        onLogout();
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Get valid token (refresh if expired)
async function getValidToken(): Promise<string> {
  let token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("No authentication token");
  }

  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }

  return token;
}

/**
 * Authenticated fetch wrapper with automatic token refresh
 * Handles token expiry transparently - components just make normal requests
 * Automatically prepends API_BASE to all URLs
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Get valid token (auto-refreshes if expired)
    const token = await getValidToken();

    // Add Authorization header
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);

    // Prepend API base URL
    const fullUrl = API_BASE + url;
    console.log(url);

    // Make request
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: "include", // Include cookies
    });

    // If 401, token might have expired between check and request - retry once
    if (response.status === 401) {
      console.log("[authFetch] 401 received, refreshing token and retrying...");
      const newToken = await refreshAccessToken();

      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(fullUrl, {
        ...options,
        headers,
        credentials: "include",
      });
    }

    return response;
  } catch (error) {
    console.error("[authFetch] Request failed:", error);
    throw error;
  }
}

/**
 * Register logout callback (called when refresh fails)
 */
export function setLogoutHandler(handler: () => void) {
  onLogout = handler;
}

/**
 * Clear logout handler (on unmount)
 */
export function clearLogoutHandler() {
  onLogout = null;
}
