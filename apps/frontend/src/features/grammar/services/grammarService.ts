/**
 * @file services/grammarService.ts
 * @description API service for grammar patterns — uses apiClient + ROUTE_PATTERNS.
 * Story 22.2: Grammar Backend API (endpoints + ROUTE_PATTERNS)
 * Story 22.3: Grammar UI (consumer)
 *
 * Per frontend-api-client.instructions.md: this is the ONLY file in the grammar
 * feature that imports `apiClient` — hooks/components never call it directly.
 *
 * - List uses `ROUTE_PATTERNS.grammarPatterns` and composes `params` from
 *   non-empty filters (search / hskLevel / phase), matching the Story 22.2
 *   endpoint contract `{ items, total, page, pageSize }`.
 * - Detail uses `ROUTE_PATTERNS.grammarPatternById(id)` → detail object.
 * - Module-level cache (pattern: `radicalsService`): list results are keyed by
 *   filter signature, detail results by id; `clearCache()` resets both.
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import { API_CONFIG } from "config";
import { mapGrammarApiToData } from "../utils";
import type { GrammarPatternData, GrammarPatternDetail, GrammarListResponse } from "../types";

/** Filter params accepted by the list endpoint. All optional + additive. */
export interface GrammarServiceListParams {
  search?: string;
  hskLevel?: number | null;
  phase?: number | null;
}

// ─── Module-level cache ────────────────────────────────────────────────
/** List cache keyed by the serialized filter signature. */
const listCache = new Map<string, GrammarPatternData[]>();
/** Detail cache keyed by pattern id ("gr_XXXX"). */
const detailCache = new Map<string, GrammarPatternDetail>();

/** Build a stable cache key from the non-empty query params. */
function listCacheKey(query: Record<string, string | number>): string {
  return Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join("&");
}

/**
 * Load grammar patterns, optionally filtered (search / hskLevel / phase).
 * Composes `params` from non-empty filters so the server does the filtering.
 */
async function loadPatterns(params: GrammarServiceListParams = {}): Promise<GrammarPatternData[]> {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.hskLevel !== undefined && params.hskLevel !== null) query.hskLevel = params.hskLevel;
  if (params.phase !== undefined && params.phase !== null) query.phase = params.phase;

  const key = listCacheKey(query);
  const cached = listCache.get(key);
  if (cached) return cached;

  const response = await apiClient.get<GrammarListResponse>(ROUTE_PATTERNS.grammarPatterns, {
    params: query,
    timeout: API_CONFIG.timeouts.sync,
    _skipRetry: true,
  });

  const items = (response.data?.items ?? []).map(mapGrammarApiToData);
  listCache.set(key, items);
  return items;
}

/**
 * Load a single grammar pattern by its content_id ("gr_XXXX") for the hub
 * detail panel. Serves from the module cache when available.
 */
async function loadPatternById(id: string): Promise<GrammarPatternDetail> {
  const cached = detailCache.get(id);
  if (cached) return cached;

  const response = await apiClient.get<GrammarPatternDetail>(
    ROUTE_PATTERNS.grammarPatternById(id),
    {
      timeout: API_CONFIG.timeouts.sync,
      _skipRetry: true,
    },
  );

  detailCache.set(id, response.data);
  return response.data;
}

/** Clear all cached grammar data (useful for testing / cache invalidation). */
function clearCache(): void {
  listCache.clear();
  detailCache.clear();
}

export const grammarService = {
  loadPatterns,
  loadPatternById,
  clearCache,
};
