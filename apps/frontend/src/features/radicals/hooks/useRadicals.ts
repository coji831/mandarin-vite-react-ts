/**
 * @file hooks/useRadicals.ts
 * @description Hook for loading and filtering radicals
 * Story 19.1: Radicals Browser Structure
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { radicalsService } from "../services/radicalsService";
import { applyFilterPipeline } from "../utils/radicalDataUtils";
import type { RadicalData, RadicalFilter } from "../types";

const DEFAULT_FILTER: RadicalFilter = {
  search: "",
  strokeCount: null,
  showTop20Only: false,
  sortBy: "kangxi_index",
};

interface UseRadicalsReturn {
  radicals: RadicalData[];
  filteredRadicals: RadicalData[];
  filter: RadicalFilter;
  setFilter: (filter: Partial<RadicalFilter>) => void;
  resetFilter: () => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRadicals(): UseRadicalsReturn {
  const [radicals, setRadicals] = useState<RadicalData[]>([]);
  const [filter, setFilterState] = useState<RadicalFilter>(DEFAULT_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await radicalsService.loadAllRadicals();
      setRadicals(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load radicals";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFilter = useCallback((partial: Partial<RadicalFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  const filteredRadicals = useMemo(() => applyFilterPipeline(radicals, filter), [radicals, filter]);

  return {
    radicals,
    filteredRadicals,
    filter,
    setFilter,
    resetFilter,
    isLoading,
    error,
    refetch: loadData,
  };
}
