/**
 * @file hooks/useGrammar.ts
 * @description Data hooks for the Grammar feature — list + detail.
 * Story 22.3: Grammar UI
 *
 * - `useGrammar`       — list load with filter state `{ search, hskLevel, phase }`,
 *                        loading/error/refetch. Search is debounced on typing
 *                        pause (500ms) and the API refetches on filter change.
 * - `useGrammarDetail` — single-pattern self-fetch for the GrammarHub detail
 *                        panel (mirrors `useRadicalById` / `useWordDetail`).
 *
 * All HTTP goes through `grammarService` — never `apiClient` directly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { grammarService } from "../services/grammarService";
import type { GrammarPatternData, GrammarPatternDetail, GrammarFilter } from "../types";

const DEFAULT_FILTER: GrammarFilter = { search: "", hskLevel: null, phase: null };

/** Debounce base on typing pause (single-word search input). */
const SEARCH_DEBOUNCE_MS = 500;

export interface UseGrammarReturn {
  patterns: GrammarPatternData[];
  filter: GrammarFilter;
  setFilter: (partial: Partial<GrammarFilter>) => void;
  resetFilter: () => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGrammar(): UseGrammarReturn {
  const [patterns, setPatterns] = useState<GrammarPatternData[]>([]);
  const [filter, setFilterState] = useState<GrammarFilter>(DEFAULT_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search value — the input updates immediately, the fetch waits for
  // a typing pause so multi-character searches don't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filter.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filter.search]);

  // Monotonic request id — drops stale responses so a slow earlier request can
  // never overwrite the result of a newer filter change.
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (search: string, hskLevel: number | null, phase: number | null) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const data = await grammarService.loadPatterns({ search, hskLevel, phase });
        if (requestId !== requestIdRef.current) return; // stale response
        setPatterns(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return; // stale error
        const message = err instanceof Error ? err.message : "Failed to load grammar patterns";
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(debouncedSearch, filter.hskLevel, filter.phase);
  }, [debouncedSearch, filter.hskLevel, filter.phase, load]);

  const setFilter = useCallback((partial: Partial<GrammarFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  const refetch = useCallback(() => {
    void load(debouncedSearch, filter.hskLevel, filter.phase);
  }, [load, debouncedSearch, filter.hskLevel, filter.phase]);

  return { patterns, filter, setFilter, resetFilter, isLoading, error, refetch };
}

export interface UseGrammarDetailReturn {
  pattern: GrammarPatternDetail | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useGrammarDetail(patternId: string | null): UseGrammarDetailReturn {
  const [pattern, setPattern] = useState<GrammarPatternDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // null id → no-op (Storybook mode / no selection)
    if (!patternId) {
      setPattern(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let cancelled = false;
    setPattern(null);
    setIsLoading(true);
    setIsError(false);

    grammarService
      .loadPatternById(patternId)
      .then((data) => {
        if (cancelled) return;
        setPattern(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patternId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return useMemo(
    () => ({ pattern, isLoading, isError, refetch }),
    [pattern, isLoading, isError, refetch],
  );
}
