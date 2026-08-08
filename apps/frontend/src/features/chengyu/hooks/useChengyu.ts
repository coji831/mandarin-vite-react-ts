/**
 * @file hooks/useChengyu.ts
 * @description Data hooks for the Chengyu feature — list + detail.
 * Story 23.3: Chengyu UI
 *
 * - `useChengyu`       — paginated list load with filter state
 *                        `{ search, theme, era }` + `page`, loading/error/
 *                        refetch. Search is debounced on typing pause (500ms —
 *                        single-token keyword) and the API refetches on filter
 *                        or page change. `page` resets to 1 whenever the
 *                        committed filters change; `total` / `totalPages` are
 *                        derived from the page result so the UI can render
 *                        pagination controls (BUG-1: previously discarded
 *                        `total`, so 35 of 55 idioms were unreachable).
 * - `useChengyuDetail` — single-idiom self-fetch for the ChengyuHub detail
 *                        panel (mirrors `useGrammarDetail` / `useRadicalById`).
 *
 * All HTTP goes through `chengyuService` — never `apiClient` directly.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chengyuService } from "../services/chengyuService";
import { CHENGYU_PAGE_SIZE } from "../constants";
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
  /** Current 1-based list page (1 = first). */
  page: number;
  /** Navigate to an exact page, clamped to [1, totalPages]. */
  setPage: (page: number) => void;
  /** Total matching idioms across all pages (from the page envelope). */
  total: number;
  /** Total pages for the current page size (never < 1). */
  totalPages: number;
  /** Items per page (matches the backend default). */
  pageSize: number;
}

export function useChengyu(): UseChengyuReturn {
  const [idioms, setIdioms] = useState<ChengyuData[]>([]);
  const [filter, setFilterState] = useState<ChengyuFilter>(DEFAULT_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);

  const pageSize = CHENGYU_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Debounced search value — the input updates immediately, the fetch waits for
  // a typing pause so multi-character searches don't fire per keystroke. A
  // committed search always restarts from page 1.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filter.search);
      setPageState(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filter.search]);

  // Monotonic request id — drops stale responses so a slow earlier request can
  // never overwrite the result of a newer filter/page change.
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (search: string, theme: string | null, era: string | null, targetPage: number) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const result = await chengyuService.loadIdioms({
          search,
          theme,
          era,
          page: targetPage,
          pageSize: CHENGYU_PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return; // stale response
        setIdioms(result.items);
        setTotal(result.total);
      } catch (err) {
        if (requestId !== requestIdRef.current) return; // stale error
        const message = err instanceof Error ? err.message : "Failed to load chengyu idioms";
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(debouncedSearch, filter.theme, filter.era, page);
  }, [debouncedSearch, filter.theme, filter.era, page, load]);

  const setFilter = useCallback((partial: Partial<ChengyuFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
    // Theme/era apply immediately (not debounced) — restart from page 1 so the
    // filtered list is browsed from the top. Search resets the page when its
    // debounced value commits (see the debounce effect above).
    if (partial.theme !== undefined || partial.era !== undefined) {
      setPageState(1);
    }
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
    setPageState(1);
  }, []);

  const setPage = useCallback(
    (nextPage: number) => {
      setPageState((prev) => {
        const clamped = Math.min(Math.max(nextPage, 1), totalPages);
        return clamped === prev ? prev : clamped;
      });
    },
    [totalPages],
  );

  const refetch = useCallback(() => {
    void load(debouncedSearch, filter.theme, filter.era, page);
  }, [load, debouncedSearch, filter.theme, filter.era, page]);

  return {
    idioms,
    filter,
    setFilter,
    resetFilter,
    isLoading,
    error,
    refetch,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
  };
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
