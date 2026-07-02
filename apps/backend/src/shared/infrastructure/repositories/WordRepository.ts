/**
 * @file apps/backend/src/shared/infrastructure/repositories/WordRepository.ts
 * @description Infrastructure implementation for word data access via Prisma
 * Clean architecture: implements IWordRepository interface
 *
 * Responsibilities:
 * - Word CRUD operations against the database
 * - Batch word lookups
 * - Word search with filters
 * - Unlearned word discovery
 *
 * Originally in modules/word/repositories/ — moved to shared during Epic 18 cleanup
 * because only AIFeedbackService (quiz module) still uses it.
 */

import { prisma } from "../database/client.js";
import type { VocabularyWord, Prisma } from "@prisma/client";

// Type aliases for complex include patterns

/** Word with categories (full) and lists (name/difficulty). */
type WordWithDetails = Prisma.VocabularyWordGetPayload<{
  include: {
    categories: { include: { category: true } };
    lists: { include: { list: { select: { name: true; difficulty: true } } }; take: 3 };
  };
}>;

/** Word with category names only. */
type WordWithCategoryNames = Prisma.VocabularyWordGetPayload<{
  include: {
    categories: { include: { category: { select: { name: true } } } };
  };
}>;

/** Word with full categories and limited list info (search results). */
type WordWithSearchDetails = Prisma.VocabularyWordGetPayload<{
  include: {
    categories: { include: { category: true } };
    lists: { include: { list: { select: { name: true; difficulty: true } } }; take: 2 };
  };
}>;

/** Word from a list, enriched with sort order. */
type WordWithSortOrder = VocabularyWord & { sortOrder: number | null };

/** Word from list query with full category includes. */
type ListedWordWithCategories = Prisma.VocabularyWordGetPayload<{
  include: {
    categories: { include: { category: true } };
  };
}>;

/**
 * WordRepository
 * Infrastructure implementation that retrieves vocabulary word data from the database.
 */
export class WordRepository {
  /**
   * Find all vocabulary words
   */
  async findAll(): Promise<VocabularyWord[]> {
    return await prisma.vocabularyWord.findMany({
      orderBy: { id: "asc" },
    });
  }

  /**
   * Find word by ID (for progress enrichment)
   */
  async findById(wordId: string): Promise<WordWithDetails | null> {
    return await prisma.vocabularyWord.findUnique({
      where: { id: wordId },
      include: {
        categories: {
          include: { category: true },
        },
        lists: {
          include: { list: { select: { name: true, difficulty: true } } },
          take: 3,
        },
      },
    });
  }

  /**
   * Find multiple words by IDs (batch operation)
   */
  async findByIds(wordIds: string[]): Promise<WordWithCategoryNames[]> {
    if (!wordIds || wordIds.length === 0) return [];

    return await prisma.vocabularyWord.findMany({
      where: { id: { in: wordIds } },
      include: {
        categories: {
          include: { category: { select: { name: true } } },
        },
      },
    });
  }

  /**
   * Find words belonging to a specific list
   */
  async findByList(listId: string): Promise<WordWithSortOrder[]> {
    const listWithWords = await prisma.vocabularyList.findUnique({
      where: { id: listId },
      include: {
        words: {
          include: {
            word: {
              include: {
                categories: {
                  include: { category: true },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!listWithWords) return [];

    return listWithWords.words.map((wl) => ({
      ...wl.word,
      sortOrder: wl.sortOrder,
    }));
  }

  /**
   * Search words across vocabulary
   */
  async search(
    query: string,
    filters: { categories?: string[]; lists?: string[]; limit?: number; offset?: number } = {},
  ): Promise<WordWithSearchDetails[]> {
    const whereClause: Record<string, unknown> = {
      AND: [
        query
          ? {
              OR: [
                { pinyin: { contains: query, mode: "insensitive" } },
                { simplified: { contains: query } },
                { traditional: { contains: query } },
                { english: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        filters.categories?.length
          ? {
              categories: {
                some: {
                  category: { name: { in: filters.categories } },
                },
              },
            }
          : {},
        filters.lists?.length
          ? {
              lists: {
                some: {
                  list: { id: { in: filters.lists } },
                },
              },
            }
          : {},
      ],
    };

    return await prisma.vocabularyWord.findMany({
      where: whereClause,
      include: {
        categories: { include: { category: true } },
        lists: {
          include: { list: { select: { name: true, difficulty: true } } },
          take: 2,
        },
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Find unlearned vocabulary words (words not in learned set)
   */
  async findUnlearnedWords(
    learnedWordIds: string[],
    limit: number = 10,
  ): Promise<VocabularyWord[]> {
    return await prisma.vocabularyWord.findMany({
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
