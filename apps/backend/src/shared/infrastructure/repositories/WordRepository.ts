/**
 * @file apps/backend/src/shared/infrastructure/repositories/WordRepository.ts
 * @description Infrastructure implementation for word data access via Prisma
 * Clean architecture: implements IWordRepository interface
 *
 * Responsibilities:
 * - Word CRUD operations against the database
 * - Batch word lookups
 * - Word search with filters (simplified, pinyin, meaning, hskLevel)
 * - Unlearned word discovery
 *
 * Originally in modules/word/repositories/ — moved to shared during Epic 18 cleanup
 * for cross-module word data access.
 * Refactored during Epic 21 Phase C — migrated from deprecated VocabularyWord to Word model.
 */

import { prisma } from "../database/client.js";
import type { Word } from "@prisma/client";
import type { WordWithDetails, WordWithCategoryNames } from "./IWordRepository.js";

/**
 * WordRepository
 * Infrastructure implementation that retrieves word data from the database.
 */
export class WordRepository {
  /**
   * Find all words
   */
  async findAll(): Promise<Word[]> {
    return await prisma.word.findMany({
      orderBy: { id: "asc" },
    });
  }

  /**
   * Find word by ID (for progress enrichment)
   * Includes HSK levels, character composition, and study context.
   */
  async findById(wordId: string): Promise<WordWithDetails | null> {
    return await prisma.word.findUnique({
      where: { id: wordId },
      include: {
        wordHskLevels: true,
        wordCharacters: {
          include: { character: true },
          orderBy: { sequenceOrder: "asc" },
        },
        wordStudyContext: true,
      },
    });
  }

  /**
   * Find multiple words by IDs (batch operation)
   */
  async findByIds(wordIds: string[]): Promise<WordWithCategoryNames[]> {
    if (!wordIds || wordIds.length === 0) return [];

    return await prisma.word.findMany({
      where: { id: { in: wordIds } },
      include: {
        wordHskLevels: true,
      },
    });
  }

  /**
   * Search words across the word corpus
   * Searches simplified, pinyin, and meaning fields with optional HSK level filter.
   */
  async search(
    query: string,
    filters: { hskLevel?: number; limit?: number; offset?: number } = {},
  ): Promise<WordWithDetails[]> {
    const whereClause: {
      AND: Array<{
        OR?: Array<{
          [key: string]: { contains: string; mode?: "insensitive" };
        }>;
        hskLevel?: number;
      }>;
    } = {
      AND: [
        query
          ? {
              OR: [
                { simplified: { contains: query } },
                { pinyin: { contains: query, mode: "insensitive" } },
                { meaning: { contains: query, mode: "insensitive" } },
              ],
            }
          : { OR: undefined as unknown as never },
        ...(filters.hskLevel !== undefined ? [{ hskLevel: filters.hskLevel } as const] : []),
      ].filter(Boolean) as (typeof whereClause)["AND"],
    };

    return await prisma.word.findMany({
      where: whereClause,
      include: {
        wordHskLevels: true,
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Find unlearned words (words not in the learned set)
   */
  async findUnlearnedWords(learnedWordIds: string[], limit: number = 10): Promise<Word[]> {
    return await prisma.word.findMany({
      where: {
        id: {
          notIn: learnedWordIds,
        },
      },
      take: limit,
      orderBy: { id: "asc" },
    });
  }
}

export default WordRepository;
