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
 *   non-empty filters (search / theme / era), matching the Story 23.2 endpoint
 *   contract `{ items, total, page, pageSize }`.
 * - Detail uses `ROUTE_PATTERNS.chengyuIdiomById(id)` → detail object.
 * - Module-level cache (pattern: `radicalsService` / `grammarService`): list
 *   results are keyed by filter signature, detail results by id; `clearCache()`
 *   resets both (used by tests for cache-invalidation coverage).
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import { API_CONFIG } from "config";
import { mapChengyuApiToData } from "../utils";
import type { ChengyuData, ChengyuDetail, ChengyuListResponse } from "../types";

/** Filter params accepted by the list endpoint. All optional + additive. */
export interface ChengyuServiceListParams {
  search?: string;
  theme?: string | null;
  era?: string | null;
}

// ─── Module-level cache ────────────────────────────────────────────────
/** List cache keyed by the serialized filter signature. */
const listCache = new Map<string, ChengyuData[]>();
/** Detail cache keyed by idiom id ("cy_XXXX"). */
const detailCache = new Map<string, ChengyuDetail>();

/** Build a stable cache key from the non-empty query params. */
function listCacheKey(query: Record<string, string | number>): string {
  return Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join("&");
}

/**
 * Load chengyu idioms, optionally filtered (search / theme / era).
 * Composes `params` from non-empty filters so the server does the filtering.
 */
async function loadIdioms(params: ChengyuServiceListParams = {}): Promise<ChengyuData[]> {
  const query: Record<string, string | number> = {};
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

  const items = (response.data?.items ?? []).map(mapChengyuApiToData);
  listCache.set(key, items);
  return items;
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
