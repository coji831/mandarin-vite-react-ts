/**
 * @file apps/backend/src/modules/words/types/words.ts
 * @description Type definitions for the Words module.
 *
 * Clean Architecture: Domain types (entities, value objects).
 */

/**
 * Full word detail returned by the word detail endpoint.
 * Matches the frontend WordDetailResponse shape from wordService.ts.
 */
export interface WordDetail {
  glyph: string;
  pinyin: string;
  definitions: string[];
  hskLevel: number | null;
  wordClass: string | null;
  frequencyRank: number | null;
  constituentCharacters: Array<{
    glyph: string;
    pinyin: string;
    meaning: string;
  }>;
}
