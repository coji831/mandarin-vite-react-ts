/**
 * @file hooks/usePhoneticClusters.ts
 * @description Hook for fetching and filtering phonetic clusters
 * Story 21.6: Phonetic Clusters
 *
 * Returns clusters, loading/error state, HSK filter, and retry.
 * Fetches all clusters on mount and applies client-side HSK filtering.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { phoneticClustersService } from "../services/phoneticClustersService";
import type { PhoneticClusterDetail } from "../types";

interface UsePhoneticClustersReturn {
  clusters: PhoneticClusterDetail[];
  isLoading: boolean;
  error: string | null;
  hskFilter: number | null;
  setHskFilter: (level: number | null) => void;
  retry: () => void;
}

export function usePhoneticClusters(): UsePhoneticClustersReturn {
  const [allClusters, setAllClusters] = useState<PhoneticClusterDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hskFilter, setHskFilter] = useState<number | null>(null);

  const fetchClusters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await phoneticClustersService.getAll();
      setAllClusters(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load phonetic clusters";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  // Apply client-side HSK filter
  const clusters = useMemo(() => {
    if (hskFilter === null) return allClusters;
    return allClusters.filter((c) => c.hskLevels.includes(hskFilter));
  }, [allClusters, hskFilter]);

  return {
    clusters,
    isLoading,
    error,
    hskFilter,
    setHskFilter,
    retry: fetchClusters,
  };
}
