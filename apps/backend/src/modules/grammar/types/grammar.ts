/**
 * @file apps/backend/src/modules/grammar/types/grammar.ts
 * @description Type definitions for the Grammar module.
 *
 * Clean Architecture: Domain types (entities, request/response shapes, error classes).
 *
 * Story 22.2 — Grammar Backend API. Grammar rows use an internal uuid PK +
 * a unique `content_id` business key ("gr_XXXX"). The API resolves and exposes
 * ONLY `content_id`; the internal uuid is never accepted as a path param and
 * never returned in responses (see pre-adaptation-static-dynamic-separation.md
 * Rule 1 + the epic-22 IMP Decision 2 reconciliation note).
 */

// ── List / summary ────────────────────────────────────────────────────────

/** Single pattern row in the list response (GET /v1/grammar/patterns). */
export interface GrammarPatternSummary {
  /** Business key "gr_XXXX" — never the internal uuid. */
  id: string;
  name: string;
  structure: string;
  /** Roadmap placement: 2 | 3 | 4 (Core 300 / Network / Advanced Fluidity). */
  phase: number;
  /** 1–6 (nullable in schema; 22.1 populates all patterns). */
  hskLevel: number | null;
  /** Stable library ordering within the phase. */
  sortOrder: number;
  exampleCount: number;
  /** Chinese text of the first example (ordered by example sortOrder). */
  previewExample: string | null;
}

/** Raw query params accepted by the controller (all optional). */
export interface GrammarListQuery {
  /** Case-insensitive substring across name/structure/explanation + example english/pinyin. */
  search?: string;
  hskLevel?: number;
  phase?: number;
  page?: number;
  pageSize?: number;
}

/** Resolved, validated list params passed to the repository. */
export interface GrammarListParams {
  search?: string;
  hskLevel?: number;
  phase?: number;
  page: number;
  pageSize: number;
}

/** List response envelope: `{ items, total, page, pageSize }`. */
export interface GrammarListResponse {
  items: GrammarPatternSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Detail ─────────────────────────────────────────────────────────────────

/** One annotated segment of an example sentence. */
export interface GrammarSegment {
  text: string;
  pinyin: string;
  gloss: string;
  entityType: "character" | "word" | null;
  /** Target entity content_id (e.g. "ch_25105", "w_00487") — null when unlinked. */
  entityId: string | null;
}

/** One example sentence of a pattern (GET /v1/grammar/patterns/:id). */
export interface GrammarExample {
  /** Business key "gr_XXXX_exN". */
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: GrammarSegment[];
}

/** A related pattern (from `relatedFrom` → `toPattern`). */
export interface GrammarRelatedPattern {
  /** Business key "gr_XXXX". */
  id: string;
  name: string;
  /** RELATED | CONTRASTS_WITH | PREREQUISITE. */
  relationType: string;
}

/** Full pattern detail returned by GET /v1/grammar/patterns/:id. */
export interface GrammarPatternDetail {
  id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  examples: GrammarExample[];
  relatedPatterns: GrammarRelatedPattern[];
}

// ── Errors ─────────────────────────────────────────────────────────────────

/**
 * Thrown by GrammarService when a `content_id` resolves to no pattern.
 * Controller maps to 404 `{ error, code: "NOT_FOUND" }`.
 */
export class GrammarNotFoundError extends Error {
  public readonly code: string;
  /** The requested content_id — carried for diagnostics; never in the message. */
  public readonly id: string;

  constructor(id: string) {
    super("Failed to load grammar pattern");
    this.name = "GrammarNotFoundError";
    this.code = "NOT_FOUND";
    this.id = id;
  }
}

/**
 * Thrown by GrammarService when a filter/pagination value is invalid.
 * Controller maps to 400 `{ error, code: "VALIDATION_ERROR" }`.
 */
export class GrammarValidationError extends Error {
  public readonly code: string;

  constructor(message = "Failed to load grammar patterns") {
    super(message);
    this.name = "GrammarValidationError";
    this.code = "VALIDATION_ERROR";
  }
}
