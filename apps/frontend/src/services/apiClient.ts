/**
 * Unified API client wrapper
 * Consolidates API_BASE duplication and provides consistent error handling
 * Prepares for future React Query/Axios migration
 */

import { API_CONFIG, getApiUrl } from "../config/api";
import { authFetch } from "../features/auth/utils/authFetch";

export class ApiClient {
  /**
   * Authenticated requests (auto-handles token refresh)
   * Use for endpoints that require authentication
   */
  static async authRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    return authFetch(endpoint, options);
  }

  /**
   * Public requests (no authentication)
   * Use for endpoints accessible without login
   */
  static async publicRequest(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = getApiUrl(endpoint);
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  }

  /**
   * Get API configuration
   */
  static get config() {
    return API_CONFIG;
  }
}
