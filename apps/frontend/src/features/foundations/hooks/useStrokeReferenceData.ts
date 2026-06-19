/**
 * @file useStrokeReferenceData.ts
 * @description Hook for loading and caching stroke reference data
 * Story 18.4: Stroke Order Reference & Animations
 */

import { useEffect, useState, useRef } from "react";
import type { StrokeData } from "../types";

let cachedData: StrokeData | null = null;

export interface UseStrokeReferenceDataReturn {
  data: StrokeData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that loads stroke reference data from /data/foundations/strokes.json
 * with module-level caching to prevent redundant network requests.
 *
 * @returns Data, loading state, and error state
 */
export function useStrokeReferenceData(): UseStrokeReferenceDataReturn {
  const [data, setData] = useState<StrokeData | null>(cachedData);
  const [error, setError] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      return;
    }
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const response = await fetch("/data/foundations/strokes.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: StrokeData = await response.json();
        cachedData = json;
        setData(json);
      } catch (err) {
        console.error("Failed to load strokes data:", err);
        setError(err instanceof Error ? err.message : "Failed to load stroke reference");
      }
    };
    loadData();
  }, []);

  return { data, isLoading: !data && !error, error };
}
