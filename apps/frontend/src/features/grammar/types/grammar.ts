/**
 * @file types/grammar.ts
 * @description Frontend data types for the Grammar feature.
 * Story 22.3: Grammar UI
 *
 * Shapes mirror the Story 22.2 API contract:
 *   - list  → GET /v1/grammar/patterns → `{ items, total, page, pageSize }`
 *   - detail → GET /v1/grammar/patterns/:id → pattern object (not wrapped in `{ data }`)
 *
 * `GrammarPatternData` is the display model for list cards, produced by
 * `mapGrammarApiToData` (see `../utils/grammarData.ts`).
 */

/** Entity link carried by an example segment token (character or word). */
export type GrammarSegmentEntityType = "character" | "word" | null;

/** A single token within an example sentence (word-segmentation output). */
export interface GrammarSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: GrammarSegmentEntityType;
  entityId: string | null;
}

/** One example sentence for a grammar pattern. */
export interface GrammarExample {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: GrammarSegment[];
}

/** Related-pattern link in the detail payload. */
export interface GrammarRelatedPattern {
  id: string;
  name: string;
  relationType: string;
}

/** List item returned by GET /v1/grammar/patterns (summary shape). */
export interface GrammarPatternSummary {
  id: string; // content_id "gr_XXXX"
  name: string;
  structure: string;
  phase: number; // 2 | 3 | 4
  hskLevel: number | null;
  sortOrder: number;
  exampleCount: number;
  previewExample: string | null;
}

/** Detail returned by GET /v1/grammar/patterns/:id. */
export interface GrammarPatternDetail {
  id: string; // content_id "gr_XXXX"
  name: string;
  structure: string;
  explanation: string;
  phase: number; // 2 | 3 | 4
  hskLevel: number | null;
  sortOrder: number;
  examples: GrammarExample[];
  relatedPatterns: GrammarRelatedPattern[];
}

/** List response envelope: { items, total, page, pageSize }. */
export interface GrammarListResponse {
  items: GrammarPatternSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Display model for list cards (mapped from a `GrammarPatternSummary`).
 * `examples?` / `relatedPatterns?` are reserved for a future richer card that
 * may embed detail data; the summary mapping never populates them.
 */
export interface GrammarPatternData {
  id: string; // content_id "gr_XXXX"
  name: string;
  structure: string;
  phase: number; // 2 | 3 | 4
  hskLevel: number | null;
  exampleCount: number;
  previewExample?: string;
  examples?: GrammarExample[];
  relatedPatterns?: GrammarRelatedPattern[];
}

/** Filter state owned by `useGrammar` — search / HSK level / phase. */
export interface GrammarFilter {
  search: string;
  hskLevel: number | null;
  phase: number | null;
}
