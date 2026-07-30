/**
 * @file apps/backend/src/modules/characters/types/characters.ts
 * @description Type definitions for the Characters module.
 *
 * Clean Architecture: Domain types (entities, value objects, response shapes).
 */

/**
 * Full character detail returned by GET /v1/characters/:glyph.
 */
export interface CharacterDetailResponse {
  glyph: string;
  pinyin: string[];
  meanings: string[];
  strokeCount: number;
  radical: { id: string; glyph: string; meaning: string } | null;
  classification: string | null;
  phoneticComponent: { glyph: string; pinyin: string; meaning: string | null } | null;
  hskLevels: number[];
  frequencyRank: number | null;
}

/**
 * Homophone readings grouped by pinyin+tone.
 */
export interface HomophoneReadingGroup {
  pinyin: string;
  tone: number;
  homophones: Array<{ glyph: string; pinyin: string; tone: number; meaning: string | null }>;
}

/**
 * Homophone response for a single character.
 */
export interface HomophoneResponse {
  glyph: string;
  readings: HomophoneReadingGroup[];
}

/**
 * A single decomposition component with positional info.
 */
export interface DecompositionComponent {
  glyph: string;
  type: string;
  meaning: string | null;
  pinyin?: string;
}

/**
 * Decomposition tree response.
 */
export interface DecompositionResponse {
  glyph: string;
  components: DecompositionComponent[];
}

/**
 * Search query parameters.
 */
export interface SearchParams {
  q?: string;
  tone?: string;
  hskLevel?: string;
}

/**
 * Single search result item.
 */
export interface SearchResultItem {
  glyph: string;
  pinyin: string;
  tone: number;
  hskLevels: number[];
}

/**
 * Frequency list entry.
 */
export interface FrequencyEntry {
  glyph: string;
  frequencyRank: number;
  hskLevel: number | null;
  pinyin: string;
  tone: number;
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * Phonetic component detail response.
 */
export interface PhoneticComponentResponse {
  glyph: string;
  pinyin: string;
  meaning: string | null;
}
