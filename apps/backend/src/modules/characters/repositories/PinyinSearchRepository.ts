/**
 * @file apps/backend/src/modules/characters/repositories/PinyinSearchRepository.ts
 * @description Repository for pinyin-based character search.
 *
 * Clean Architecture: Data access layer.
 * Handles Prisma queries for searching characters by pinyin.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import { stripToneAndDigits } from "@mandarin/shared-utils";

export interface PinyinSearchParams {
  q: string;
  tone?: number;
  page: number;
  pageSize: number;
}

export interface PinyinSearchResultItem {
  glyph: string;
  pinyin: string;
  tone: number;
  meaning: string | null;
}

export interface PinyinSearchResponse {
  query: string;
  totalResults: number;
  page: number;
  pageSize: number;
  results: PinyinSearchResultItem[];
}

export class PinyinSearchRepository {
  async searchByPinyin(params: PinyinSearchParams): Promise<PinyinSearchResponse> {
    const { q, tone, page, pageSize } = params;
    // Normalize tone marks AND a trailing tone digit via the canonical shared
    // helper — "mā", "ma" and "ma1" all reduce to "ma". The indexed
    // pinyinSyllable.syllable column is tone-NUMBER ("ba1"), so stripping both
    // makes every input form match the same syllable prefix.
    const normalizedQuery = stripToneAndDigits(q);

    const where: Record<string, unknown> = {
      pinyinSyllable: {
        syllable: { startsWith: normalizedQuery },
      },
    };

    if (tone !== undefined) {
      (where.pinyinSyllable as Record<string, unknown>).tone = tone;
    }

    const [mappings, total] = await Promise.all([
      prisma.pinyinCharacterMapping.findMany({
        where,
        include: {
          character: {
            select: { glyph: true, definition: true },
          },
          pinyinSyllable: {
            select: { syllablePretty: true, tone: true },
          },
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ pinyinSyllable: { syllable: "asc" } }, { pinyinSyllable: { tone: "asc" } }],
      }),
      prisma.pinyinCharacterMapping.count({ where }),
    ]);

    const results: PinyinSearchResultItem[] = mappings.map((m) => ({
      glyph: m.character.glyph,
      pinyin: m.pinyinSyllable.syllablePretty,
      tone: m.pinyinSyllable.tone,
      meaning: m.character.definition,
    }));

    return {
      query: q,
      totalResults: total,
      page,
      pageSize,
      results,
    };
  }
}
