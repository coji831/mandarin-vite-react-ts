/**
 * Shared API types for consistent request/response handling
 * Used across frontend and backend for type-safe API communication
 *
 * @module @mandarin/shared-types/api
 */

/**
 * Generic API response wrapper
 * Ensures consistent response structure across all endpoints
 *
 * @template T - The type of data in the response
 *
 * @example
 * ```typescript
 * interface UserData { id: string; name: string; }
 * const response: ApiResponse<UserData> = {
 *   success: true,
 *   data: { id: '123', name: 'Alice' }
 * };
 * ```
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
