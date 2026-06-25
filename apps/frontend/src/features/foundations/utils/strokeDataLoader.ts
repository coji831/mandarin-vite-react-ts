/**
 * @file utils/strokeDataLoader.ts
 * @description Shared stroke data loader with module-level caching
 * Story 18.4: Stroke Order Reference & Animations
 * Story P2: Moved from direct public/data fetch to backend API via foundationsService.
 *
 * Centralizes the fetch + cache pattern for strokes.json data,
 * eliminating triplicated data loading across hooks and components.
 * Cache lives in foundationsService for cross-tab sharing.
 */

import type { StrokeData } from "../types";
import { foundationsService } from "../services/foundationsService";

let cachedStrokeData: StrokeData | null = null;

/**
 * Load stroke data from the backend API with module-level caching.
 * Subsequent calls return the cached result immediately.
 *
 * @returns Promise resolving to StrokeData
 * @throws Error if the fetch fails
 */
export async function loadStrokeData(): Promise<StrokeData> {
  if (cachedStrokeData) return cachedStrokeData;
  const data = await foundationsService.getStrokesReference();
  cachedStrokeData = data;
  return cachedStrokeData;
}

/**
 * Get the cached stroke data synchronously if it has been loaded.
 * Returns null if data hasn't been loaded yet.
 */
export function getCachedStrokeData(): StrokeData | null {
  return cachedStrokeData;
}

/**
 * Clear the cached stroke data (useful for testing).
 */
export function clearStrokeDataCache(): void {
  cachedStrokeData = null;
}
