/**
 * @file hooks/usePassages.ts
 * @description Hook for fetching and managing the passage library.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Covers loading, error, retry, and empty states.
 */
import { useState, useEffect, useCallback } from "react";
import { fetchPassages } from "../services/passageService";
import type { PassageSummary } from "../types";

export function usePassages(hskLevel?: number) {
  const [passages, setPassages] = useState<PassageSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchPassages(hskLevel);
      setPassages(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [hskLevel]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    passages,
    isLoading,
    hasError,
    /** True only when loading is complete, no error occurred, and passages array is empty. */
    isEmpty: !isLoading && !hasError && passages.length === 0,
    retry: load,
  };
}
