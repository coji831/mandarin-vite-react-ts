/**
 * @file wordService.ts
 * @description Service layer for Word Detail + Measure Word API calls.
 * Story 21.7: Phase 3 — Wire LexicalHubRouter to self-fetch data via hubStore
 * Story 21.8: Measure Word Foundation — measure word lookup by word ID
 *
 * Follows the same pattern as characterService.ts.
 * apiClient is ONLY used here (never in hooks/components).
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";

// ─── Types ─────────────────────────────────────────────────────────────────

export type WordDetailResponse = {
  /** Internal word ID (e.g., "w_00284") — used to look up measure words. */
  id: string;
  glyph: string;
  pinyin: string;
  definitions: string[];
  hskLevel?: number;
  constituentCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
};

/** A measure word (量词) that pairs with a noun word. */
export type MeasureWord = {
  id: string;
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  category: string | null;
  usageNote: string | null;
  isDefault: boolean;
  exampleSentence: string | null;
};

/** Response shape of GET /v1/words/:id/measure-words (NOT wrapped in `data`). */
export type MeasureWordsResponse = {
  wordId: string;
  simplified: string | null;
  measureWords: MeasureWord[];
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

// ─── Measure Words ─────────────────────────────────────────────────────────

/**
 * Load the measure words (量词) compatible with a given noun word.
 * The controller returns the result directly (no `data` wrapper).
 * Throws on network error or non-2xx response.
 */
export async function loadMeasureWords(wordId: string): Promise<MeasureWordsResponse> {
  const response = await apiClient.get<MeasureWordsResponse>(
    ROUTE_PATTERNS.wordsMeasureWords(wordId),
    { timeout: 10000 },
  );
  return response.data;
}
