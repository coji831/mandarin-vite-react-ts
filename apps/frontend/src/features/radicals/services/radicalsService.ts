/**
 * @file services/radicalsService.ts
 * @description Service for loading radical content from backend API
 * Story 19.1: Radicals Browser Structure
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import { API_CONFIG } from "config";
import { mapRadicalToData } from "../utils";
import type { RadicalApiItem, RadicalData } from "../types";

// ─── Module-level cache ────────────────────────────────────────────────
let cachedRadicals: RadicalData[] | null = null;

/**
 * Load all radicals from backend API.
 * Maps the backend's camelCase payload into the frontend snake_case shape.
 *
 * Fail-fast: uses a short timeout + skips the automatic network-error retry so a
 * blocked/unreachable backend surfaces the error UI promptly instead of leaving
 * the browse stuck in "Loading radicals…" (V9).
 */
async function loadAllRadicals(): Promise<RadicalData[]> {
  if (cachedRadicals) return cachedRadicals;
  const response = await apiClient.get(ROUTE_PATTERNS.radicals, {
    timeout: API_CONFIG.timeouts.sync,
    _skipRetry: true,
  });
  const items = (response.data ?? []) as RadicalApiItem[];
  cachedRadicals = items.map(mapRadicalToData);
  return cachedRadicals;
}

/**
 * Load a single radical by its ID from the cached list or API.
 * Maps the backend's camelCase payload into the frontend snake_case shape.
 */
async function loadRadicalById(id: string): Promise<RadicalData> {
  if (cachedRadicals) {
    const found = cachedRadicals.find((r) => r.id === id);
    if (found) return found;
  }
  const response = await apiClient.get(ROUTE_PATTERNS.radicalsById(id), {
    timeout: API_CONFIG.timeouts.sync,
    _skipRetry: true,
  });
  return mapRadicalToData(response.data as RadicalApiItem);
}

/**
 * Load characters associated with a radical via the backend API.
 */
async function getRadicalCharacters(radicalId: string): Promise<{
  radicalId: string;
  characters: Array<{
    glyph: string;
    pinyin: string;
    meaning: string;
    classification?: string | null;
    etymology?: string | null;
  }>;
}> {
  const response = await apiClient.get(ROUTE_PATTERNS.radicalsCharacters(radicalId));
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
  getRadicalCharacters,
  clearCache,
};
