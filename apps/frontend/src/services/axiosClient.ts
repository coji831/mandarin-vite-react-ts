/**
 * Centralized Axios client for all API requests
 * Configured with base URL, timeout, credentials, and error handling
 *
 * Story 14.2a: Production-ready foundation with basic error interceptor
 * Story 14.3: Auth refresh + retry logic interceptors
 *
 * @example
 * ```typescript
 * import { apiClient } from '@/services/axiosClient';
 * import type { ApiResponse } from '@mandarin/shared-types';
 *
 * interface UserData { id: string; name: string; }
 *
 * const response = await apiClient.get<ApiResponse<UserData>>('/api/v1/user');
 * const user = response.data.data; // Type-safe access
 * ```
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

import type { NormalizedError } from "@mandarin/shared-types";
import { API_CONFIG } from "config";

const TOKEN_KEY = "accessToken";
let refreshPromise: Promise<string> | null = null;
let logoutCallback: (() => void) | null = null;

/**
 * Register logout callback (called by AuthContext)
 * Triggered when token refresh fails (refresh token expired)
 */
export function setLogoutCallback(callback: () => void) {
  logoutCallback = callback;
}

/**
 * Clear logout callback on unmount
 */
export function clearLogoutCallback() {
  logoutCallback = null;
}

/**
 * Check if JWT token is expired (with 30s buffer)
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000;
    return expiryTime - 30000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Refresh access token using httpOnly refresh token cookie
 * Prevents multiple simultaneous refresh requests
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log("[apiClient] Refreshing access token...");
      const response = await axios.post(
        API_CONFIG.baseURL + ROUTE_PATTERNS.authRefresh,
        {},
        { withCredentials: true },
      );

      const { accessToken } = response.data.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      console.log("[apiClient] Token refreshed successfully");
      return accessToken;
    } catch (error) {
      console.error("[apiClient] Token refresh failed:", error);
      localStorage.removeItem(TOKEN_KEY);
      if (logoutCallback) {
        logoutCallback();
      }
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Configured Axios instance
 * Pre-configured with baseURL, timeout, credentials, and headers
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: Add Authorization header with access token
 * Auto-refreshes token if expired before making request
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      // Refresh token proactively if expired
      if (isTokenExpired(token)) {
        try {
          token = await refreshAccessToken();
        } catch (error) {
          // If refresh fails, continue without token (will get 401)
          console.warn("[apiClient] Proactive refresh failed, continuing request");
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: Handle auth errors and retry logic
 * - 401: Refresh token and retry request
 * - Network errors: Retry with exponential backoff
 */
apiClient.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  // Handle errors with retry logic
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Handle 401: Refresh token and retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user will be logged out via callback
        return Promise.reject(createNormalizedError(error));
      }
    }

    // Handle network errors: Retry with exponential backoff
    const isNetworkError =
      !error.response && (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK");
    if (isNetworkError && originalRequest && (originalRequest._retryCount || 0) < 3) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000; // 1s, 2s, 4s

      console.log(
        `[apiClient] Retrying request (attempt ${originalRequest._retryCount}/3) after ${delay}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // No retry applicable, return normalized error
    return Promise.reject(createNormalizedError(error));
  },
);

/**
 * Create normalized error structure for consistent error handling
 */
function createNormalizedError(error: AxiosError): NormalizedError {
  const responseMessage = (error.response?.data as any)?.message;
  const axiosMessage = error.message;
  const defaultFallback = "An unexpected error occurred";

  const message = responseMessage
    ? responseMessage
    : error.response
      ? defaultFallback
      : axiosMessage || defaultFallback;

  const normalizedError: NormalizedError = {
    message,
    status: error.response?.status,
    code: error.code || (error.response ? undefined : "ERR_NETWORK"),
    originalError: error,
  };

  // Log error for debugging
  console.error("[apiClient] Request failed:", {
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    status: normalizedError.status,
    code: normalizedError.code,
    message: normalizedError.message,
  });

  return normalizedError;
}

/**
 * Default export for convenience
 * Named export (apiClient) is preferred for tree-shaking
 */
export default apiClient;
