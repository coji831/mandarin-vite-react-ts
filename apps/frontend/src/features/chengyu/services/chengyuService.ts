/**
 * @file services/chengyuService.ts
 * @description API service for chengyu idioms — uses apiClient + ROUTE_PATTERNS.
 * Story 23.2: Chengyu Backend API (endpoints + ROUTE_PATTERNS)
 * Story 23.3: Chengyu UI (consumer)
 *
 * Per frontend-api-client.instructions.md: this is the ONLY file in the chengyu
 * feature that imports `apiClient` — hooks/components never call it directly.
 *
 * - List uses `ROUTE_PATTERNS.chengyuIdioms` and composes `params` from
 *   non-empty filters (search / theme / era) plus `page` / `pageSize`,
 *   matching the Story 23.2 endpoint contract `{ items, total, page, pageSize }`.
 *   It returns the page result (`items` + `total`/`page`/`pageSize`) so the UI
 *   can render pagination controls (BUG-1: the list previously discarded
 *   `total` and only ever fetched page 1).
 * - Detail uses `ROUTE_PATTERNS.chengyuIdiomById(id)` → detail object.
 * - Module-level cache (pattern: `radicalsService` / `grammarService`): list
 *   results are keyed by filter signature **+ page + pageSize** (page 2 is never
 *   served page-1 data), detail results by id; `clearCache()` resets both
 *   (used by tests for cache-invalidation coverage).
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import { API_CONFIG } from "config";
import { mapChengyuApiToData } from "../utils";
import { CHENGYU_PAGE_SIZE } from "../constants";
import type { ChengyuDetail, ChengyuListResponse, ChengyuListResult } from "../types";

/** Filter params accepted by the list endpoint. All optional + additive. */
export interface ChengyuServiceListParams {
  search?: string;
  theme?: string | null;
  era?: string | null;
  /** 1-based page (≥ 1, default 1). */
  page?: number;
  /** Items per page (1–100, default 20). */
  pageSize?: number;
}

// ─── Module-level cache ────────────────────────────────────────────────
/** List cache keyed by the serialized filter + pagination signature. */
const listCache = new Map<string, ChengyuListResult>();
/** Detail cache keyed by idiom id ("cy_XXXX"). */
const detailCache = new Map<string, ChengyuDetail>();

/** Build a stable cache key from the query params (page/pageSize included). */
function listCacheKey(query: Record<string, string | number>): string {
  return Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join("&");
}

/**
 * Load a page of chengyu idioms, optionally filtered (search / theme / era)
 * and paginated (page / pageSize). Composes `params` from non-empty filters so
 * the server does the filtering; `page`/`pageSize` default to the backend
 * defaults so every key (and therefore every cache entry) is page-scoped.
 */
async function loadIdioms(params: ChengyuServiceListParams = {}): Promise<ChengyuListResult> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? CHENGYU_PAGE_SIZE,
  };
  if (params.search) query.search = params.search;
  if (params.theme !== undefined && params.theme !== null) query.theme = params.theme;
  if (params.era !== undefined && params.era !== null) query.era = params.era;

  const key = listCacheKey(query);
  const cached = listCache.get(key);
  if (cached) return cached;

  const response = await apiClient.get<ChengyuListResponse>(ROUTE_PATTERNS.chengyuIdioms, {
    params: query,
    timeout: API_CONFIG.timeouts.sync,
    _skipRetry: true,
  });

  const { items = [], total = 0, page = 1, pageSize = CHENGYU_PAGE_SIZE } = response.data;
  const result: ChengyuListResult = {
    items: items.map(mapChengyuApiToData),
    total,
    page,
    pageSize,
  };
  listCache.set(key, result);
  return result;
}

/**
 * Load a single idiom by its content_id ("cy_XXXX") for the hub detail panel.
 * Serves from the module cache when available.
 */
async function loadIdiomById(id: string): Promise<ChengyuDetail> {
  const cached = detailCache.get(id);
  if (cached) return cached;

  const response = await apiClient.get<ChengyuDetail>(ROUTE_PATTERNS.chengyuIdiomById(id), {
    timeout: API_CONFIG.timeouts.sync,
    _skipRetry: true,
  });

  detailCache.set(id, response.data);
  return response.data;
}

/** Clear all cached chengyu data (useful for testing / cache invalidation). */
function clearCache(): void {
  listCache.clear();
  detailCache.clear();
}

export const chengyuService = {
  loadIdioms,
  loadIdiomById,
  clearCache,
};
