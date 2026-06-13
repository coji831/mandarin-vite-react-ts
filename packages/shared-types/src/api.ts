/**
 * Shared API types for consistent request/response handling
 * Used across frontend and backend for type-safe API communication
 *
 * @module @mandarin/shared-types/api
 */

/**
 * Generic API response wrapper
 *
 * @deprecated This type uses a wrapper envelope pattern ({ success, data }) that the project no longer follows.
 * The backend returns data directly without wrapping. Use the direct type instead.
 * This type will be removed in v2.0.
 *
 * @template T - The type of data in the response
 *
 * @example
 * ```typescript
 * // ❌ DEPRECATED - Do not use this pattern
 * interface UserData { id: string; name: string; }
 * const response: ApiResponse<UserData> = {
 *   success: true,
 *   data: { id: '123', name: 'Alice' }
 * };
 *
 * // ✅ CORRECT - Backend returns data directly
 * const response: UserData = { id: '123', name: 'Alice' };
 * // Or with Axios:
 * const axiosResponse = await apiClient.get<UserData>('/api/v1/user');
 * const user = axiosResponse.data; // Direct access - Axios wraps HTTP body in .data
 * ```
 *
 * @see {@link https://github.com/your-org/your-repo/blob/main/docs/guides/conventions/api-client.md API Client Patterns}
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError;
}

/**
 * Standardized API error structure
 * Provides consistent error information for debugging and user feedback
 *
 * @example
 * ```typescript
 * const error: ApiError = {
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid email format',
 *   field: 'email'
 * };
 * ```
 */
export interface ApiError {
  code: string;
  message: string;
  field?: string; // For validation errors
  details?: unknown; // Additional error context
}

/**
 * Normalized error structure from Axios interceptor
 * Used internally by axiosClient error handling
 *
 * @internal
 */
export interface NormalizedError {
  message: string;
  status?: number;
  code?: string; // Axios error codes: ECONNABORTED, ERR_NETWORK, etc.
  originalError: unknown;
}
