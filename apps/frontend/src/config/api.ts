/**
 * Centralized API configuration for frontend
 * Single source of truth for backend URL and request settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
  withCredentials: true,
} as const;

/**
 * Get full API URL for an endpoint
 * @param endpoint - API endpoint (should start with /)
 * @returns Full URL
 */
export function getApiUrl(endpoint: string): string {
  return API_CONFIG.baseURL + endpoint;
}
