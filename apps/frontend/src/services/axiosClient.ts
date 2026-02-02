/**
 * Centralized Axios client for all API requests
 * Configured with base URL, timeout, credentials, and error handling
 *
 * Story 14.2a: Production-ready foundation with basic error interceptor
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

import axios, { AxiosError, AxiosInstance } from "axios";
import { API_CONFIG } from "../config/api";
import type { NormalizedError } from "@mandarin/shared-types";

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
 * Basic error interceptor (Phase 1)
 * Normalizes error structure for consistent handling
 *
 * Advanced features (retry, token refresh) will be added in Phase 2 (Story 14.2b)
 */
apiClient.interceptors.response.use(
  // Pass through successful responses
  (response) => response,

  // Normalize error structure
  (error: AxiosError) => {
    // Extract message with proper fallback chain
    const responseMessage = (error.response?.data as any)?.message;
    const axiosMessage = error.message;
    const defaultFallback = "An unexpected error occurred";

    // Use response message, or fallback for responses without message, or axios message for network errors
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

    // Log error for debugging (console only in Phase 1)
    console.error("[apiClient] Request failed:", {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: normalizedError.status,
      code: normalizedError.code,
      message: normalizedError.message,
    });

    return Promise.reject(normalizedError);
  },
);

/**
 * Default export for convenience
 * Named export (apiClient) is preferred for tree-shaking
 */
export default apiClient;
