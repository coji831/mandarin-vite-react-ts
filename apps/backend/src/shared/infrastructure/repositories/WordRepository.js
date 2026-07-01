/**
 * @file apps/backend/src/shared/infrastructure/repositories/WordRepository.js
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

/**
 * WordRepository
 * Infrastructure implementation that retrieves vocabulary word data from the database.
 */
export class WordRepository {
  /**
   * Find all vocabulary words
   * @returns {Promise<Array>} All vocabulary words
   */
  async findAll() {
    return await prisma.vocabularyWord.findMany({
      orderBy: { id: "asc" },
    });
  }

  /**
   * Find word by ID (for progress enrichment)
   * @param {string} wordId - Word identifier
   * @returns {Promise<object|null>} Word with categories and lists
   */
  async findById(wordId) {
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
   * @param {string[]} wordIds - Array of word IDs
   * @returns {Promise<Array>} Vocabulary words with categories
   */
  async findByIds(wordIds) {
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
   * @param {string} listId - List identifier
   * @returns {Promise<Array>} Words in the list
   */
  async findByList(listId) {
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
   * @param {string} query - Search query text
   * @param {object} [filters={}] - Search filters
   * @param {string[]} [filters.categories] - Filter by category names
   * @param {string[]} [filters.lists] - Filter by list IDs
   * @param {number} [filters.limit=50] - Maximum results
   * @param {number} [filters.offset=0] - Pagination offset
   * @returns {Promise<Array>} Matching words with categories and list info
   */
  async search(query, filters = {}) {
    const whereClause = {
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
   * @param {string[]} learnedWordIds - Array of already learned word IDs
   * @param {number} limit - Maximum number of words to return
   * @returns {Promise<Array>} Array of unlearned vocabulary words
   */
  async findUnlearnedWords(learnedWordIds, limit = 10) {
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
