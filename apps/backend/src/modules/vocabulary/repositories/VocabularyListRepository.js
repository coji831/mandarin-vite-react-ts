/**
 * @file apps/backend/src/modules/vocabulary/repositories/VocabularyListRepository.js
 * @description Infrastructure implementation for vocabulary list and category data access
 * Clean architecture: implements IVocabularyRepository interface (list/category portion)
 *
 * Responsibilities:
 * - List CRUD operations
 * - Category lookups
 * - GCS fallback for legacy migration support
 */

import * as gcsClient from "../../../shared/infrastructure/external/GCSClient.js";
import { vocabularyConfig } from "../../../shared/config/index.js";
import { parseCsvText } from "../../../shared/infrastructure/parsers/CsvParser.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("VocabularyListRepository");

/**
 * VocabularyListRepository
 * Infrastructure implementation for vocabulary list and category data access.
 * Extracted from VocabularyRepository to separate list/category operations from word concerns.
 */
export class VocabularyListRepository {
  constructor() {
    this._listsCache = null;
    this._cacheTs = 0;
  }

  /**
   * Find all vocabulary lists (database)
   * @returns {Promise<Array>} All public vocabulary lists
   */
  async findAllLists() {
    const dbLists = await prisma.vocabularyList.findMany({
      where: { isPublic: true },
      orderBy: { name: "asc" },
    });

    if (dbLists.length > 0) {
      return dbLists;
    }

    return await this._findAllListsFromGCS();
  }

  /**
   * Find list by ID
   * @param {string} listId - List identifier
   * @returns {Promise<object|null>} Vocabulary list or null
   */
  async findListById(listId) {
    const dbList = await prisma.vocabularyList.findUnique({
      where: { id: listId },
    });

    if (dbList) {
      return dbList;
    }

    const lists = await this._findAllListsFromGCS();
    return lists.find((l) => l.id === listId) || null;
  }

  /**
   * Find words for a list (uses normalized database schema)
   * @param {string} listId - List identifier
   * @returns {Promise<Array>} Words in the list
   */
  async findWordsForList(listId) {
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

    if (listWithWords) {
      return listWithWords.words.map((wl) => ({
        ...wl.word,
        sortOrder: wl.sortOrder,
      }));
    }

    return await this._findWordsForListFromGCS(listId);
  }

  /**
   * Find all categories
   * @returns {Promise<Array>} All categories ordered by display order
   */
  async findAllCategories() {
    return await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * Search lists with optional filters (legacy method)
   * @param {string} query - Search query
   * @param {object} [filters={}] - Search filters
   * @param {string[]} [filters.difficulties] - Filter by difficulty levels
   * @param {string[]} [filters.tags] - Filter by tags
   * @returns {Promise<Array>} Matching lists
   */
  async searchLists(query, filters = {}) {
    let lists = await this.findAllLists();
    if (query) {
      lists = lists.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          (l.description || "").toLowerCase().includes(query.toLowerCase()),
      );
    }

    if (filters.difficulties?.length) {
      lists = lists.filter((l) => filters.difficulties.includes(l.difficulty));
    }

    if (filters.tags?.length) {
      lists = lists.filter((l) => (l.tags || []).some((t) => filters.tags.includes(t)));
    }

    return lists;
  }

  /**
   * Find all lists from GCS (legacy/migration method)
   * @private
   */
  async _findAllListsFromGCS() {
    const now = Date.now();
    if (this._listsCache && now - this._cacheTs < vocabularyConfig.cacheTTL * 1000) {
      return this._listsCache;
    }

    const contents = await gcsClient.downloadFile(vocabularyConfig.listsFile);
    const raw = contents.toString("utf-8");

    const lists = JSON.parse(raw);
    this._listsCache = lists;
    this._cacheTs = now;
    return lists;
  }

  /**
   * Find words for list from GCS CSV (legacy/migration method)
   * @private
   * @param {string} listId - List identifier
   * @returns {Promise<Array>} Words from CSV
   */
  async _findWordsForListFromGCS(listId) {
    const list = await this.findListById(listId);
    if (!list) return [];

    const csvFile = list.csvFile || `${list.id}.csv`;

    const buf = await gcsClient.downloadFile(csvFile);
    const csvText = buf.toString("utf-8");

    const rows = parseCsvText(csvText);
    return rows;
  }
}

export default VocabularyListRepository;
