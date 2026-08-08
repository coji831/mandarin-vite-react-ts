/**
 * @file apps/backend/src/modules/chengyu/types/chengyu.ts
 * @description Type definitions for the Chengyu module.
 *
 * Clean Architecture: Domain types (entities, request/response shapes, error classes).
 *
 * Story 23.2 — Chengyu Backend API. Chengyu rows use an internal uuid PK +
 * a unique `content_id` business key ("cy_XXXX"). The API resolves and exposes
 * ONLY `content_id`; the internal uuid is never accepted as a path param and
 * never returned in responses (mirrors the Grammar module, Epic 22 — see
 * docs/issue-implementation/epic-23-idiom-database/story-23-2-chengyu-backend-api.md).
 */

// ── List / summary ────────────────────────────────────────────────────────

/** Single idiom row in the list response (GET /v1/chengyu/idioms). */
export interface ChengyuSummary {
  /** Business key "cy_XXXX" — never the internal uuid. */
  id: string;
  /** The 4-character idiom, e.g. "破釜沉舟". */
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  /** Stable library ordering. */
  sortOrder: number;
  exampleCount: number;
  /** Chinese text of the first example (ordered by example sortOrder). */
  previewExample: string | null;
}

/** Raw query params accepted by the controller (all optional). */
export interface ChengyuListQuery {
  /** Case-insensitive substring across chengyu/pinyin/literalMeaning/figurativeMeaning/story + example english/pinyin. */
  search?: string;
  /** Exact match against `theme`. */
  theme?: string;
  /** Exact match against `era`. */
  era?: string;
  page?: number;
  pageSize?: number;
}

/** Resolved, validated list params passed to the repository. */
export interface ChengyuListParams {
  search?: string;
  theme?: string;
  era?: string;
  page: number;
  pageSize: number;
}

/** List response envelope: `{ items, total, page, pageSize }`. */
export interface ChengyuListResponse {
  items: ChengyuSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Detail ─────────────────────────────────────────────────────────────────

/** One annotated segment of an example sentence. */
export interface ChengyuSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  /** Target entity content_id (e.g. "ch_25105", "w_00487") — null when unlinked. */
  entityId: string | null;
}

/** One example sentence of an idiom (GET /v1/chengyu/idioms/:id). */
export interface ChengyuExample {
  /** Business key "cy_XXXX_exN". */
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  /** Always an array — a Postgres JSON null is coerced to `[]` (Epic 22 hardening). */
  segments: ChengyuSegment[];
}

/** A related idiom (from `relatedFrom` → `toChengyu`). */
export interface ChengyuRelatedIdiom {
  /** Business key "cy_XXXX". */
  id: string;
  chengyu: string;
  /** RELATED | CONTRASTS_WITH | PREREQUISITE. */
  relationType: string;
}

/** Full idiom detail returned by GET /v1/chengyu/idioms/:id. */
export interface ChengyuDetail {
  id: string;
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

// ── Errors ─────────────────────────────────────────────────────────────────

/**
 * Thrown by ChengyuService when a `content_id` resolves to no idiom.
 * Controller maps to 404 `{ error, code: "NOT_FOUND" }`.
 */
export class ChengyuNotFoundError extends Error {
  public readonly code: string;
  /** The requested content_id — carried for diagnostics; never in the message. */
  public readonly id: string;

  constructor(id: string) {
    super("Failed to load chengyu idiom");
    this.name = "ChengyuNotFoundError";
    this.code = "NOT_FOUND";
    this.id = id;
  }
}

/**
 * Thrown by ChengyuService when a filter/pagination value is invalid.
 * Controller maps to 400 `{ error, code: "VALIDATION_ERROR" }`.
 */
export class ChengyuValidationError extends Error {
  public readonly code: string;

  constructor(message = "Failed to load chengyu idioms") {
    super(message);
    this.name = "ChengyuValidationError";
    this.code = "VALIDATION_ERROR";
  }
}
