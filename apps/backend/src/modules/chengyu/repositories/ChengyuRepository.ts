/**
 * @file apps/backend/src/modules/chengyu/repositories/ChengyuRepository.ts
 * @description Repository for Chengyu Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 *
 * Story 23.2 — Chengyu Backend API. All queries run against the seeded
 * Chengyu / ChengyuExample / ChengyuRelation tables (all-in-DB — no JSON file
 * reads). Rows are resolved by the unique `content_id` business key
 * ("cy_XXXX"); the internal uuid PK is never used as a lookup key and is
 * never returned to callers.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { ChengyuListParams, ChengyuSummary } from "../types/chengyu.js";

// ── Internal Query Result Types ──────────────────────────────────────────

/** List-endpoint row: idiom + example count + first example (for preview). */
interface ChengyuListRow {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  era: string;
  theme: string;
  sortOrder: number;
  _count: { examples: number };
  examples: Array<{ chinese: string }>;
}

/** Detail-endpoint row: idiom + ordered examples + related-from relations. */
export interface ChengyuDetailRow {
  content_id: string;
  chengyu: string;
  pinyin: string;
  literalMeaning: string;
  figurativeMeaning: string;
  story: string;
  storySource: string;
  era: string;
  theme: string;
  sortOrder: number;
  examples: Array<{
    content_id: string;
    chinese: string;
    pinyin: string;
    english: string;
    segments: unknown;
    sortOrder: number;
  }>;
  relatedFrom: Array<{
    relationType: string;
    toChengyu: { content_id: string; chengyu: string } | null;
  }>;
}

// ── Mappers ───────────────────────────────────────────────────────────────

/** Map a raw list row to the API summary shape (`id` = content_id). */
function toSummary(row: ChengyuListRow): ChengyuSummary {
  return {
    id: row.content_id,
    chengyu: row.chengyu,
    pinyin: row.pinyin,
    literalMeaning: row.literalMeaning,
    figurativeMeaning: row.figurativeMeaning,
    era: row.era,
    theme: row.theme,
    sortOrder: row.sortOrder,
    exampleCount: row._count.examples,
    previewExample: row.examples[0]?.chinese ?? null,
  };
}

// ── Repository ───────────────────────────────────────────────────────────

/**
 * Repository for chengyu idiom database queries.
 */
export class ChengyuRepository {
  /**
   * List idioms with additive, optional filters + pagination.
   * `search` matches (case-insensitive) across chengyu/pinyin/literalMeaning/
   * figurativeMeaning/story and any example's english/pinyin; `theme` and
   * `era` are exact matches. Rows are ordered by sortOrder (stable library
   * ordering).
   *
   * @param params - Resolved, validated list params
   * @returns The page of summary items + the total matching count
   */
  async findIdioms(params: ChengyuListParams): Promise<{ items: ChengyuSummary[]; total: number }> {
    const where: Prisma.ChengyuWhereInput = {};

    if (params.search) {
      where.OR = [
        { chengyu: { contains: params.search, mode: "insensitive" } },
        { pinyin: { contains: params.search, mode: "insensitive" } },
        { literalMeaning: { contains: params.search, mode: "insensitive" } },
        { figurativeMeaning: { contains: params.search, mode: "insensitive" } },
        { story: { contains: params.search, mode: "insensitive" } },
        {
          examples: {
            some: {
              OR: [
                { english: { contains: params.search, mode: "insensitive" } },
                { pinyin: { contains: params.search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }
    if (params.theme !== undefined) {
      where.theme = params.theme;
    }
    if (params.era !== undefined) {
      where.era = params.era;
    }

    const [rows, total] = await Promise.all([
      prisma.chengyu.findMany({
        where,
        include: {
          _count: { select: { examples: true } },
          // First example only — powers the summary `previewExample`.
          examples: { orderBy: { sortOrder: "asc" }, take: 1, select: { chinese: true } },
        },
        orderBy: { sortOrder: "asc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.chengyu.count({ where }),
    ]);

    return { items: rows.map(toSummary), total };
  }

  /**
   * Resolve a single idiom by its unique business key (`content_id` "cy_XXXX").
   * The internal uuid is never a valid lookup — callers validate the id shape
   * before this is invoked.
   *
   * @param contentId - The idiom business key, e.g. "cy_0001"
   * @returns Raw idiom with ordered examples + relatedFrom relations, or null
   */
  async findByContentId(contentId: string): Promise<ChengyuDetailRow | null> {
    return prisma.chengyu.findUnique({
      where: { content_id: contentId },
      include: {
        examples: { orderBy: { sortOrder: "asc" } },
        relatedFrom: {
          include: { toChengyu: { select: { content_id: true, chengyu: true } } },
        },
      },
    });
  }
}
