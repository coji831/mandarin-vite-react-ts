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
import { isAuthFailure } from "./errors";

/**
 * Extend axios request config with an opt-out flag for the automatic
 * network-error retry. Set `_skipRetry: true` on a request (e.g. fail-fast
 * browse fetches) to surface the error immediately instead of entering the
 * 1s/2s/4s backoff retry chain.
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    _skipRetry?: boolean;
  }
}

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
 * Refresh access token using httpOnly refresh token cookie.
 * EXPORTED shared single-flight refresh (F4 fix).
 *
 * The module-level `refreshPromise` dedupes every concurrent caller
 * (AuthContext bootstrap, axios interceptor, background refresh) into ONE
 * in-flight POST /auth/refresh. The backend ROTATES (revokes) the refresh
 * cookie on every use, so a second concurrent POST with the same cookie fails
 * 401 INVALID_TOKEN — without this dedupe the losing racer is treated as
 * fatal and the user is wrongly logged out.
 *
 * Failure side effects happen EXACTLY ONCE here: the localStorage access token
 * is removed and the registered logout callback (AuthContext → setUser(null))
 * is invoked. Callers must NOT duplicate these side effects.
 */
export function requestAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        API_CONFIG.baseURL + ROUTE_PATTERNS.authRefresh,
        {},
        { withCredentials: true },
      );

      const { accessToken } = response.data.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      return accessToken;
    } catch (error) {
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
          token = await requestAccessToken();
        } catch {
          // If refresh fails, continue without token (will get 401)
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
 * - 401 (missing/expired) or 403 INVALID_TOKEN (tampered): Refresh token and retry request once
 * - Network errors: Retry with exponential backoff (unless `_skipRetry`)
 */
apiClient.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  // Handle errors with retry logic
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
      _skipRetry?: boolean;
    };

    // Normalize once up front so the shared auth-failure classifier reads a
    // canonical shape (single source of truth — see shared/api/errors.ts).
    const normalized = createNormalizedError(error);

    // Auth failure: 401 (missing/expired token) or 403 INVALID_TOKEN (forged/tampered token).
    // The backend returns 403 for tampered access tokens — without this, those never refresh (F4).
    if (isAuthFailure(normalized) && originalRequest && !originalRequest._retry) {
      // Never try to refresh-then-retry the refresh call itself.
      const isRefreshRequest = (originalRequest.url ?? "").includes("auth/refresh");
      if (isRefreshRequest) {
        return Promise.reject(normalized);
      }

      originalRequest._retry = true;

      try {
        const newToken = await requestAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (_refreshError) {
        // Refresh failed, user will be logged out via callback
        return Promise.reject(normalized);
      }
    }

    // Handle network errors: Retry with exponential backoff (GET only — POST/PUT/DELETE are not idempotent)
    const isNetworkError =
      !error.response && (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK");
    const isSafeMethod = (originalRequest?.method?.toUpperCase() ?? "GET") === "GET";
    if (
      isNetworkError &&
      isSafeMethod &&
      originalRequest &&
      !originalRequest._skipRetry &&
      (originalRequest._retryCount || 0) < 3
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000; // 1s, 2s, 4s

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // No retry applicable, return normalized error
    return Promise.reject(normalized);
  },
);

/**
 * Create normalized error structure for consistent error handling
 */
function createNormalizedError(error: AxiosError): NormalizedError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return normalizedError;
}

/**
 * Default export for convenience
 * Named export (apiClient) is preferred for tree-shaking
 */
export default apiClient;
