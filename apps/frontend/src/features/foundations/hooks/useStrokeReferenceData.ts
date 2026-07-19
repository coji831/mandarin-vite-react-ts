/**
 * @file useStrokeReferenceData.ts
 * @description Hook for loading and caching stroke reference data
 * Story 18.4: Stroke Order Reference & Animations
 */

import { useEffect, useState, useRef, useCallback } from "react";
import type { StrokeData } from "../types";
import {
  loadStrokeData,
  getCachedStrokeData,
  clearStrokeDataCache,
} from "../utils/strokeDataLoader";

export interface UseStrokeReferenceDataReturn {
  data: StrokeData | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Hook that loads stroke reference data from /data/foundations/strokes.json
 * with module-level caching to prevent redundant network requests.
 *
 * @returns Data, loading state, error state, and retry callback
 */
export function useStrokeReferenceData(): UseStrokeReferenceDataReturn {
  const [data, setData] = useState<StrokeData | null>(getCachedStrokeData());
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (data) return;
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const json = await loadStrokeData();
        setData(json);
      } catch (err) {
        // [Foundations] Failed to load stroke reference data
        console.error("[StrokeReference] Failed to load strokes data:", err);
        setError(err instanceof Error ? err.message : "Failed to load stroke reference");
      }
    };
    loadData();
  }, [data]);

  const retry = useCallback(() => {
    clearStrokeDataCache();
    fetchAttempted.current = false;
    setError(null);
    setData(null);
  }, []);

  return { data, isLoading: !data && !error, error, retry };
}
