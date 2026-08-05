/**
 * @file apps/backend/src/modules/grammar/services/GrammarService.ts
 * @description Business logic for grammar pattern lookups.
 *
 * Clean Architecture: Application Service / Use Case.
 * Thin orchestration + validation + typed errors. All error messages follow
 * `backend-error-messages.instructions.md` ("Failed to {action} {resource}";
 * `{ error, code }` shape; VALIDATION_ERROR / NOT_FOUND / INTERNAL_ERROR).
 *
 * Story 22.2 — Grammar Backend API. `page`/`pageSize` bounds mirror the
 * shared-constants `PAGINATION` block. The detail endpoint resolves by the
 * unique `content_id` ("gr_XXXX") — the internal uuid is never exposed.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { PAGINATION } from "@mandarin/shared-constants";
import {
  GrammarRepository,
  type GrammarPatternDetailRow,
} from "../repositories/GrammarRepository.js";
import {
  GrammarNotFoundError,
  GrammarValidationError,
  type GrammarExample,
  type GrammarListQuery,
  type GrammarListResponse,
  type GrammarPatternDetail,
  type GrammarSegment,
} from "../types/grammar.js";

const logger = createLogger("GrammarService");

// ── Validation constants ──────────────────────────────────────────────────

/** Valid roadmap phases (Core 300 / Network / Advanced Fluidity). */
const VALID_PHASES = new Set<number>([2, 3, 4]);
const MIN_HSK_LEVEL = 1;
const MAX_HSK_LEVEL = 6;
const MIN_PAGE = 1;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = PAGINATION.MAX_PAGE_SIZE;
const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * Service for grammar pattern business logic.
 */
export class GrammarService {
  private readonly repository: GrammarRepository;

  constructor(repository: GrammarRepository) {
    this.repository = repository;
    logger.info("Initialized Grammar Service");
  }

  /**
   * List patterns with optional additive filters + pagination.
   * All filters are optional — an empty query returns the full library
   * paginated (no "at least one filter" requirement).
   *
   * @param query - Raw (uncoerced) list query; `page`/`pageSize` defaulted here
   * @returns `{ items, total, page, pageSize }`
   * @throws GrammarValidationError on invalid phase/hskLevel/page/pageSize
   */
  async listPatterns(query: GrammarListQuery): Promise<GrammarListResponse> {
    const params = this.validateListQuery(query);
    const { items, total } = await this.repository.findPatterns(params);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  /**
   * Get a single pattern by its business key (`content_id` "gr_XXXX").
   *
   * @param id - The pattern business key, e.g. "gr_0018"
   * @returns Mapped GrammarPatternDetail (examples[] + relatedPatterns[])
   * @throws GrammarNotFoundError if no pattern matches the content_id
   */
  async getPattern(id: string): Promise<GrammarPatternDetail> {
    const pattern = await this.repository.findByContentId(id);
    if (!pattern) {
      throw new GrammarNotFoundError(id);
    }
    return mapDetail(pattern);
  }

  /**
   * Validate + resolve list query values. Range/type rules live here (the
   * single source of truth, unit-tested); the controller only coerces raw
   * query strings.
   */
  private validateListQuery(
    query: GrammarListQuery,
  ): Required<Pick<GrammarListQuery, "page" | "pageSize">> & GrammarListQuery {
    const { search, hskLevel, phase } = query;
    const page = query.page ?? MIN_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    if (phase !== undefined && (!Number.isInteger(phase) || !VALID_PHASES.has(phase))) {
      throw new GrammarValidationError();
    }
    if (
      hskLevel !== undefined &&
      (!Number.isInteger(hskLevel) || hskLevel < MIN_HSK_LEVEL || hskLevel > MAX_HSK_LEVEL)
    ) {
      throw new GrammarValidationError();
    }
    if (!Number.isInteger(page) || page < MIN_PAGE) {
      throw new GrammarValidationError();
    }
    if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
      throw new GrammarValidationError();
    }

    return { search, hskLevel, phase, page, pageSize };
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────

/** Map a raw detail row to the API detail shape (`id` = content_id). */
function mapDetail(row: GrammarPatternDetailRow): GrammarPatternDetail {
  return {
    id: row.content_id,
    name: row.name,
    structure: row.structure,
    explanation: row.explanation,
    phase: row.phase,
    hskLevel: row.hskLevel,
    sortOrder: row.sortOrder,
    examples: row.examples.map(mapExample),
    relatedPatterns: row.relatedFrom
      .filter((r) => r.toPattern !== null)
      .map((r) => ({
        id: r.toPattern!.content_id,
        name: r.toPattern!.name,
        relationType: r.relationType,
      })),
  };
}

/** Map a raw example row to the API example shape. */
function mapExample(example: GrammarPatternDetailRow["examples"][number]): GrammarExample {
  return {
    id: example.content_id,
    chinese: example.chinese,
    pinyin: example.pinyin,
    english: example.english,
    segments: Array.isArray(example.segments) ? (example.segments as GrammarSegment[]) : [],
  };
}
