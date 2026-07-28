/**
 * @file wordService.ts
 * @description Service layer for Word Detail API calls.
 * Story 21.7: Phase 3 — Wire LexicalHubRouter to self-fetch data via hubStore
 *
 * Follows the same pattern as characterService.ts.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";

// ─── Types ─────────────────────────────────────────────────────────────────

export type WordDetailResponse = {
  glyph: string;
  pinyin: string;
  definitions: string[];
  hskLevel?: number;
  constituentCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
};

// ─── Word Detail ───────────────────────────────────────────────────────────

/**
 * Load full word detail (pinyin, definitions, HSK level, constituent characters)
 * from the backend.
 * Throws on network error or non-2xx response.
 */
export async function loadWordData(glyph: string): Promise<WordDetailResponse> {
  const response = await apiClient.get<{ data: WordDetailResponse }>(
    ROUTE_PATTERNS.wordsByGlyph(glyph),
    { timeout: 10000 },
  );
  return response.data.data ?? response.data;
}
