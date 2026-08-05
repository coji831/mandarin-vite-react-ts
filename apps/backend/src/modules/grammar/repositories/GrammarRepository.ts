/**
 * @file apps/backend/src/modules/grammar/repositories/GrammarRepository.ts
 * @description Repository for Grammar Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 *
 * Story 22.2 — Grammar Backend API. All queries run against the seeded
 * GrammarPattern / GrammarExample / GrammarPatternRelation tables (all-in-DB —
 * no JSON file reads). Rows are resolved by the unique `content_id` business
 * key ("gr_XXXX"); the internal uuid PK is never used as a lookup key.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { GrammarListParams, GrammarPatternSummary } from "../types/grammar.js";

// ── Internal Query Result Types ──────────────────────────────────────────

/** List-endpoint row: pattern + example count + first example (for preview). */
interface GrammarPatternListRow {
  content_id: string;
  name: string;
  structure: string;
  phase: number;
  hskLevel: number | null;
  sortOrder: number;
  _count: { examples: number };
  examples: Array<{ chinese: string }>;
}

/** Detail-endpoint row: pattern + ordered examples + related-from relations. */
export interface GrammarPatternDetailRow {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  phase: number;
  hskLevel: number | null;
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
    toPattern: { content_id: string; name: string } | null;
  }>;
}

// ── Mappers ───────────────────────────────────────────────────────────────

/** Map a raw list row to the API summary shape (`id` = content_id). */
function toSummary(row: GrammarPatternListRow): GrammarPatternSummary {
  return {
    id: row.content_id,
    name: row.name,
    structure: row.structure,
    phase: row.phase,
    hskLevel: row.hskLevel,
    sortOrder: row.sortOrder,
    exampleCount: row._count.examples,
    previewExample: row.examples[0]?.chinese ?? null,
  };
}

// ── Repository ───────────────────────────────────────────────────────────

/**
 * Repository for grammar pattern database queries.
 */
export class GrammarRepository {
  /**
   * List patterns with additive, optional filters + pagination.
   * `search` matches (case-insensitive) across name/structure/explanation and
   * any example's english/pinyin; `hskLevel` and `phase` are exact matches.
   * Rows are ordered by phase then sortOrder (stable library ordering).
   *
   * @param params - Resolved, validated list params
   * @returns The page of summary items + the total matching count
   */
  async findPatterns(
    params: GrammarListParams,
  ): Promise<{ items: GrammarPatternSummary[]; total: number }> {
    const where: Prisma.GrammarPatternWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { structure: { contains: params.search, mode: "insensitive" } },
        { explanation: { contains: params.search, mode: "insensitive" } },
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
    if (params.hskLevel !== undefined) {
      where.hskLevel = params.hskLevel;
    }
    if (params.phase !== undefined) {
      where.phase = params.phase;
    }

    const [rows, total] = await Promise.all([
      prisma.grammarPattern.findMany({
        where,
        include: {
          _count: { select: { examples: true } },
          // First example only — powers the summary `previewExample`.
          examples: { orderBy: { sortOrder: "asc" }, take: 1, select: { chinese: true } },
        },
        orderBy: [{ phase: "asc" }, { sortOrder: "asc" }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.grammarPattern.count({ where }),
    ]);

    return { items: rows.map(toSummary), total };
  }

  /**
   * Resolve a single pattern by its unique business key (`content_id` "gr_XXXX").
   * The internal uuid is never a valid lookup — callers validate the id shape
   * before this is invoked.
   *
   * @param contentId - The pattern business key, e.g. "gr_0018"
   * @returns Raw pattern with ordered examples + relatedFrom relations, or null
   */
  async findByContentId(contentId: string): Promise<GrammarPatternDetailRow | null> {
    return prisma.grammarPattern.findUnique({
      where: { content_id: contentId },
      include: {
        examples: { orderBy: { sortOrder: "asc" } },
        relatedFrom: {
          include: { toPattern: { select: { content_id: true, name: true } } },
        },
      },
    });
  }
}
