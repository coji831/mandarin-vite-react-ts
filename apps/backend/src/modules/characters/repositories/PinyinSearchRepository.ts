/**
 * @file apps/backend/src/modules/characters/repositories/PinyinSearchRepository.ts
 * @description Repository for pinyin-based character search.
 *
 * Clean Architecture: Data access layer.
 * Handles Prisma queries for searching characters by pinyin.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

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
    const normalizedQuery = q.toLowerCase().replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (c) => {
      const toneMap: Record<string, string> = {
        ā: "a",
        á: "a",
        ǎ: "a",
        à: "a",
        ē: "e",
        é: "e",
        ě: "e",
        è: "e",
        ī: "i",
        í: "i",
        ǐ: "i",
        ì: "i",
        ō: "o",
        ó: "o",
        ǒ: "o",
        ò: "o",
        ū: "u",
        ú: "u",
        ǔ: "u",
        ù: "u",
        ǖ: "ü",
        ǘ: "ü",
        ǚ: "ü",
        ǜ: "ü",
        ü: "ü",
      };
      return toneMap[c] || c;
    });

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
