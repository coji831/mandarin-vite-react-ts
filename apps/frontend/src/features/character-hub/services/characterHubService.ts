/**
 * @file characterHubService.ts
 * @description Service layer for Character Detail Hub API calls
 * Story 19.5: Character Hub Radical Section
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import type { RadicalData } from "features/radicals/types";

/**
 * Load radicals associated with a character from the backend database.
 * Returns empty array if the API call fails (fallback behavior).
 */
export async function loadRadicalsByCharacter(character: string): Promise<RadicalData[]> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.radicalsByCharacter(character));
    if (Array.isArray(response.data)) {
      return response.data;
    }
  } catch {
    // Silently fail — caller should fall back to client-side matching
  }
  return [];
}
