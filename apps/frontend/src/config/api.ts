/**
 * Centralized API configuration for frontend
 * Single source of truth for backend URL and request settings
 *
 * Story 14.2a: Enhanced with security, validation, and flexible timeouts
 */

/**
 * Validate API URL format at startup
 * Fail-fast if VITE_API_URL is malformed
 */
function validateApiUrl(url: string): string {
  try {
    new URL(url); // Throws if invalid
    return url;
  } catch {
    throw new Error(`[API_CONFIG] Invalid VITE_API_URL: "${url}". Must be a valid HTTP/HTTPS URL.`);
  }
}

/**
 * Check if credentials (cookies) should be included for this domain
 * Security: Only enable withCredentials for trusted domains
 */
function isCredentialedDomain(url?: string): boolean {
  if (!url) return true; // localhost default is trusted

  try {
    const apiUrl = new URL(url);
    const allowedDomains = [
      "localhost",
      "127.0.0.1",
      "mandarin-app.com", // Production domain
      "railway.app", // Backend hosting
      "vercel.app", // Frontend preview deployments
    ];

    return allowedDomains.some((domain) => apiUrl.hostname.includes(domain));
  } catch {
    return false; // Invalid URL → no credentials
  }
}

/**
 * Centralized API configuration
 */
export const API_CONFIG = {
  baseURL: validateApiUrl(import.meta.env.VITE_API_URL || "http://localhost:3001"),

  /**
   * Default timeout for most operations (10s)
   */
  timeout: 10000,

  /**
   * Include credentials (cookies) for authenticated requests
   * Only enabled for trusted domains (security)
   */
  withCredentials: isCredentialedDomain(import.meta.env.VITE_API_URL),

  /**
   * Per-operation timeout overrides
   * Use these for operations with different timing requirements
   */
  timeouts: {
    default: 10000, // Standard CRUD operations
    upload: 60000, // File uploads (1 minute)
    download: 30000, // Audio/CSV downloads (30 seconds)
    sync: 5000, // Background sync (fail fast)
  },
} as const;

/**
 * Get full API URL for an endpoint (legacy helper)
 * Kept for backward compatibility with existing code
 *
 * @param endpoint - API endpoint (should start with /)
 * @returns Full URL
 *
 * @deprecated Use axiosClient directly instead
 */
export function getApiUrl(endpoint: string): string {
  return API_CONFIG.baseURL + endpoint;
}
