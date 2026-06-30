/**
 * @file services/radicalsService.ts
 * @description Service for loading radical content from backend API
 * Story 19.1: Radicals Browser Structure
 */

import { apiClient } from "../../../shared/api/axiosClient";
import type { RadicalData } from "../types";

// ─── Module-level cache ────────────────────────────────────────────────
let cachedRadicals: RadicalData[] | null = null;

/**
 * Load all radicals from backend API.
 */
async function loadAllRadicals(): Promise<RadicalData[]> {
  if (cachedRadicals) return cachedRadicals;
  const response = await apiClient.get("/v1/radicals");
  cachedRadicals = response.data;
  return response.data;
}

/**
 * Load a single radical by its ID from the cached list or API.
 */
async function loadRadicalById(id: string): Promise<RadicalData> {
  if (cachedRadicals) {
    const found = cachedRadicals.find((r) => r.id === id);
    if (found) return found;
  }
  const response = await apiClient.get(`/v1/radicals/${id}`);
  return response.data;
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
