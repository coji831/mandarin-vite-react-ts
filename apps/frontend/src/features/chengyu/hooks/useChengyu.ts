/**
 * @file hooks/useChengyu.ts
 * @description Data hooks for the Chengyu feature — list + detail.
 * Story 23.3: Chengyu UI
 *
 * - `useChengyu`       — list load with filter state `{ search, theme, era }`,
 *                        loading/error/refetch. Search is debounced on typing
 *                        pause (500ms — single-token keyword) and the API
 *                        refetches on filter change.
 * - `useChengyuDetail` — single-idiom self-fetch for the ChengyuHub detail
 *                        panel (mirrors `useGrammarDetail` / `useRadicalById`).
 *
 * All HTTP goes through `chengyuService` — never `apiClient` directly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chengyuService } from "../services/chengyuService";
import type { ChengyuData, ChengyuDetail, ChengyuFilter } from "../types";

const DEFAULT_FILTER: ChengyuFilter = { search: "", theme: null, era: null };

/** Debounce base on typing pause (single-keyword search input). */
const SEARCH_DEBOUNCE_MS = 500;

export interface UseChengyuReturn {
  idioms: ChengyuData[];
  filter: ChengyuFilter;
  setFilter: (partial: Partial<ChengyuFilter>) => void;
  resetFilter: () => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChengyu(): UseChengyuReturn {
  const [idioms, setIdioms] = useState<ChengyuData[]>([]);
  const [filter, setFilterState] = useState<ChengyuFilter>(DEFAULT_FILTER);
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

  const load = useCallback(async (search: string, theme: string | null, era: string | null) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await chengyuService.loadIdioms({ search, theme, era });
      if (requestId !== requestIdRef.current) return; // stale response
      setIdioms(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return; // stale error
      const message = err instanceof Error ? err.message : "Failed to load chengyu idioms";
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(debouncedSearch, filter.theme, filter.era);
  }, [debouncedSearch, filter.theme, filter.era, load]);

  const setFilter = useCallback((partial: Partial<ChengyuFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  const refetch = useCallback(() => {
    void load(debouncedSearch, filter.theme, filter.era);
  }, [load, debouncedSearch, filter.theme, filter.era]);

  return { idioms, filter, setFilter, resetFilter, isLoading, error, refetch };
}

export interface UseChengyuDetailReturn {
  idiom: ChengyuDetail | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useChengyuDetail(idiomId: string | null): UseChengyuDetailReturn {
  const [idiom, setIdiom] = useState<ChengyuDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // null id → no-op (Storybook mode / no selection)
    if (!idiomId) {
      setIdiom(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let cancelled = false;
    setIdiom(null);
    setIsLoading(true);
    setIsError(false);

    chengyuService
      .loadIdiomById(idiomId)
      .then((data) => {
        if (cancelled) return;
        setIdiom(data);
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
  }, [idiomId, reloadKey]);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  return useMemo(
    () => ({ idiom, isLoading, isError, refetch }),
    [idiom, isLoading, isError, refetch],
  );
}
