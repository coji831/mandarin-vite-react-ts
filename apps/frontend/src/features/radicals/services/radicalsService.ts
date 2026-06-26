/**
 * @file services/radicalsService.ts
 * @description Service for loading radical content
 * Story 19.1: Radicals Browser Structure
 *
 * TODO: When backend API endpoint is ready, replace mock data with apiClient call:
 *   import { apiClient } from "../../../shared/api/axiosClient";
 *   const response = await apiClient.get("/v1/radicals");
 *   return response.data;
 * See foundationsService.ts for the reference pattern.
 */

import type { RadicalData } from "../types";
import { MOCK_RADICALS } from "./radicalsMockData";

// ─── Module-level cache ────────────────────────────────────────────────
let cachedRadicals: RadicalData[] | null = null;

/**
 * Load all radicals from mock data.
 * TODO: Replace with backend API call.
 */
async function loadAllRadicals(): Promise<RadicalData[]> {
  if (cachedRadicals) return cachedRadicals;
  // Simulate async API call
  cachedRadicals = MOCK_RADICALS;
  return MOCK_RADICALS;
}

/**
 * Load a single radical by its ID from the cached list.
 * TODO: Will be used by Story 19.2 (Radical Detail Card)
 */
async function loadRadicalById(id: string): Promise<RadicalData> {
  if (cachedRadicals) {
    const found = cachedRadicals.find((r) => r.id === id);
    if (found) return found;
  }
  // Fallback: search in mock data without cache
  const found = MOCK_RADICALS.find((r) => r.id === id);
  if (!found) throw new Error(`Radical not found: ${id}`);
  return found;
}

/**
 * Clear all cached radical data (useful for testing).
 */
function clearCache(): void {
  cachedRadicals = null;
}

export const radicalsService = {
  loadAllRadicals,
  loadRadicalById,
  clearCache,
};
