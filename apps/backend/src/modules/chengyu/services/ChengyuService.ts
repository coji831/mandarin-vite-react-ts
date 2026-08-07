/**
 * @file apps/backend/src/modules/chengyu/services/ChengyuService.ts
 * @description Business logic for chengyu idiom lookups.
 *
 * Clean Architecture: Application Service / Use Case.
 * Thin orchestration + validation + typed errors. All error messages follow
 * `backend-error-messages.instructions.md` ("Failed to {action} {resource}";
 * `{ error, code }` shape; VALIDATION_ERROR / NOT_FOUND / INTERNAL_ERROR).
 *
 * Story 23.2 — Chengyu Backend API. `page`/`pageSize` bounds mirror the
 * shared-constants `PAGINATION` block; `theme`/`era` are exact-match filters
 * and a provided-but-empty value is invalid (BR Rule 6). The detail endpoint
 * resolves by the unique `content_id` ("cy_XXXX") — the internal uuid is
 * never exposed. The list endpoint is read-only and returns the full library
 * paginated when unfiltered; per BR Rule 3 caching is optional and is NOT
 * enabled here (the grammar precedent caches nothing; a list cache would need
 * explicit invalidation to avoid stale data).
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { PAGINATION } from "@mandarin/shared-constants";
import { ChengyuRepository, type ChengyuDetailRow } from "../repositories/ChengyuRepository.js";
import {
  ChengyuNotFoundError,
  ChengyuValidationError,
  type ChengyuDetail,
  type ChengyuExample,
  type ChengyuListQuery,
  type ChengyuListResponse,
  type ChengyuSegment,
} from "../types/chengyu.js";

const logger = createLogger("ChengyuService");

// ── Validation constants ──────────────────────────────────────────────────

const MIN_PAGE = 1;
const MIN_PAGE_SIZE = 1;
const MAX_PAGE_SIZE = PAGINATION.MAX_PAGE_SIZE;
const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

/**
 * Service for chengyu idiom business logic.
 */
export class ChengyuService {
  private readonly repository: ChengyuRepository;

  constructor(repository: ChengyuRepository) {
    this.repository = repository;
    logger.info("Initialized Chengyu Service");
  }

  /**
   * List idioms with optional additive filters + pagination.
   * All filters are optional — an empty query returns the full library
   * paginated (no "at least one filter" requirement).
   *
   * @param query - Raw (uncoerced) list query; `page`/`pageSize` defaulted here
   * @returns `{ items, total, page, pageSize }`
   * @throws ChengyuValidationError on invalid theme/era/page/pageSize
   */
  async listIdioms(query: ChengyuListQuery): Promise<ChengyuListResponse> {
    const params = this.validateListQuery(query);
    const { items, total } = await this.repository.findIdioms(params);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  /**
   * Get a single idiom by its business key (`content_id` "cy_XXXX").
   *
   * @param id - The idiom business key, e.g. "cy_0001"
   * @returns Mapped ChengyuDetail (examples[] + relatedIdioms[])
   * @throws ChengyuNotFoundError if no idiom matches the content_id
   */
  async getIdiom(id: string): Promise<ChengyuDetail> {
    const idiom = await this.repository.findByContentId(id);
    if (!idiom) {
      throw new ChengyuNotFoundError(id);
    }
    return mapDetail(idiom);
  }

  /**
   * Validate + resolve list query values. Range/type rules live here (the
   * single source of truth, unit-tested); the controller only coerces raw
   * query strings.
   */
  private validateListQuery(
    query: ChengyuListQuery,
  ): Required<Pick<ChengyuListQuery, "page" | "pageSize">> & ChengyuListQuery {
    const { search, theme, era } = query;
    const page = query.page ?? MIN_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    if (theme !== undefined && (typeof theme !== "string" || theme.trim() === "")) {
      throw new ChengyuValidationError();
    }
    if (era !== undefined && (typeof era !== "string" || era.trim() === "")) {
      throw new ChengyuValidationError();
    }
    if (!Number.isInteger(page) || page < MIN_PAGE) {
      throw new ChengyuValidationError();
    }
    if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
      throw new ChengyuValidationError();
    }

    return { search, theme, era, page, pageSize };
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────

/** Map a raw detail row to the API detail shape (`id` = content_id). */
function mapDetail(row: ChengyuDetailRow): ChengyuDetail {
  return {
    id: row.content_id,
    chengyu: row.chengyu,
    pinyin: row.pinyin,
    literalMeaning: row.literalMeaning,
    figurativeMeaning: row.figurativeMeaning,
    story: row.story,
    storySource: row.storySource,
    era: row.era,
    theme: row.theme,
    sortOrder: row.sortOrder,
    examples: row.examples.map(mapExample),
    relatedIdioms: row.relatedFrom
      .filter((r) => r.toChengyu !== null)
      .map((r) => ({
        id: r.toChengyu!.content_id,
        chengyu: r.toChengyu!.chengyu,
        relationType: r.relationType,
      })),
  };
}

/** Map a raw example row to the API example shape. */
function mapExample(example: ChengyuDetailRow["examples"][number]): ChengyuExample {
  return {
    id: example.content_id,
    chinese: example.chinese,
    pinyin: example.pinyin,
    english: example.english,
    // Postgres JSON null guard — segments is always an array (Epic 22 hardening).
    segments: Array.isArray(example.segments) ? (example.segments as ChengyuSegment[]) : [],
  };
}
