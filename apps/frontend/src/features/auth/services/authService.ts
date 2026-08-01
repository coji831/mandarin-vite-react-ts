/**
 * authService.ts — Auth feature API calls (service layer).
 *
 * Mandated by frontend-api-client.instructions.md: hooks/components/contexts
 * NEVER call apiClient directly — every HTTP request goes through a service.
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import type { User } from "../types";

class AuthService {
  /**
   * Fetch the current authenticated user (GET /v1/auth/me).
   *
   * The axios response interceptor transparently handles 401 / 403
   * INVALID_TOKEN (expired/tampered access token) by refreshing via the shared
   * single-flight `requestAccessToken()` and retrying the request once — so a
   * successful resolution means the session was restored (F4 fix).
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: { user: User } }>(
      ROUTE_PATTERNS.authMe,
    );
    return response.data.data.user;
  }
}

export const authService = new AuthService();
