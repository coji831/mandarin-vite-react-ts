/**
 * @file types/chengyu.ts
 * @description Frontend data types for the Chengyu (idiom) feature.
 * Story 23.3: Chengyu UI
 *
 * Shapes mirror the Story 23.2 API contract:
 *   - list   → GET /v1/chengyu/idioms → `{ items, total, page, pageSize }`
 *   - detail → GET /v1/chengyu/idioms/:id → idiom detail (not wrapped in `{ data }`)
 *
 * `ChengyuData` is the display model for list cards, produced by
 * `mapChengyuApiToData` (see `../utils/chengyuData.ts`).
 */

/** Entity link carried by an example segment token (character or word). */
export type ChengyuSegmentEntityType = "character" | "word" | null;

/** A single token within an example sentence (word-segmentation output). */
export interface ChengyuSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: ChengyuSegmentEntityType;
  entityId: string | null;
}

/** One modern-usage example sentence for an idiom. */
export interface ChengyuExample {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: ChengyuSegment[];
}

/** Related-idiom cross-link in the detail payload (from `ChengyuRelation` rows). */
export interface ChengyuRelatedIdiom {
  id: string;
  chengyu: string;
  relationType: string;
}

/** List item returned by GET /v1/chengyu/idioms (summary shape). */
export interface ChengyuSummary {
  id: string; // content_id "cy_XXXX"
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  sortOrder: number;
  exampleCount: number;
  previewExample: string | null;
}

/** Detail returned by GET /v1/chengyu/idioms/:id. */
export interface ChengyuDetail {
  id: string; // content_id "cy_XXXX"
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  examples: ChengyuExample[];
  relatedIdioms: ChengyuRelatedIdiom[];
}

/** List response envelope: { items, total, page, pageSize }. */
export interface ChengyuListResponse {
  items: ChengyuSummary[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Service-level page result: mapped display items + pagination metadata.
 * Produced by `chengyuService.loadIdioms` so consumers get `total` (and can
 * derive `totalPages`) alongside the current page's items — the raw envelope
 * (`ChengyuListResponse`) stays API-shaped and never leaves the service.
 */
export interface ChengyuListResult {
  items: ChengyuData[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Display model for list cards (mapped from a `ChengyuSummary`).
 * `examples?` / `relatedIdioms?` are reserved for a future richer card that
 * may embed detail data; the summary mapping never populates them.
 */
export interface ChengyuData {
  id: string; // content_id "cy_XXXX"
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  exampleCount: number;
  previewExample?: string;
  examples?: ChengyuExample[];
  relatedIdioms?: ChengyuRelatedIdiom[];
}

/** Filter state owned by `useChengyu` — search / theme / era. */
export interface ChengyuFilter {
  search: string;
  theme: string | null;
  era: string | null;
}
