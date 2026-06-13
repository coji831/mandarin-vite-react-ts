/**
 * @file apps/backend/src/modules/vocabulary/repositories/VocabularyRepository.js
 * @description Infrastructure implementation for vocabulary list and category data access
 * Clean architecture: implements IVocabularyRepository interface (list/category portion)
 *
 * Responsibilities:
 * - List CRUD operations
 * - Category lookups
 * - GCS fallback for legacy migration support
 *
 * Note: Word CRUD operations have been extracted to WordRepository.js
 */

import * as gcsClient from "../../../shared/infrastructure/external/GCSClient.js";
import { vocabularyConfig } from "../../../shared/config/index.js";
import { parseCsvText } from "../../../shared/infrastructure/parsers/CsvParser.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("VocabularyRepository");

/**
 * VocabularyRepository
 * Infrastructure implementation for vocabulary list and category data access.
 *
 * Word CRUD operations have been extracted to WordRepository.js.
 * This repository now focuses on list/category operations only.
 *
 * Notes:
 * - Primary source: PostgreSQL database (normalized schema)
 * - Fallback/migration source: CSV files from GCS
 * - Uses simple in-memory cache for vocabularyLists.json
 */
export class VocabularyRepository {
  constructor() {
    // in-memory cache of the lists file (for CSV migration)
    this._listsCache = null;
    this._cacheTs = 0;
  }

  /**
   * Find all vocabulary lists (database)
   */
  async findAllLists() {
    // Try database first
    const dbLists = await prisma.vocabularyList.findMany({
      where: { isPublic: true },
      orderBy: { name: "asc" },
    });

    if (dbLists.length > 0) {
      return dbLists;
    }

    // Fallback to GCS for migration
    return await this._findAllListsFromGCS();
  }

  /**
   * Find all lists from GCS (legacy/migration method)
   * @private
   */
  async _findAllListsFromGCS() {
    // simple in-memory TTL cache
    const now = Date.now();
    if (this._listsCache && now - this._cacheTs < vocabularyConfig.cacheTTL * 1000) {
      return this._listsCache;
    }

    // Use GCSClient from infrastructure/external
    const contents = await gcsClient.downloadFile(vocabularyConfig.listsFile);
    const raw = contents.toString("utf-8");

    const lists = JSON.parse(raw);
    this._listsCache = lists;
    this._cacheTs = now;
    return lists;
  }

  /**
   * Find list by ID
   */
  async findListById(listId) {
    // Try database first
    const dbList = await prisma.vocabularyList.findUnique({
      where: { id: listId },
    });

    if (dbList) {
      return dbList;
    }

    // Fallback to GCS
    const lists = await this._findAllListsFromGCS();
    return lists.find((l) => l.id === listId) || null;
  }

  /**
   * Find words for a list (uses normalized database schema)
   * Story 15-2: Uses normalized database schema
   */
  async findWordsForList(listId) {
    // Try database first
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

    // Fallback to GCS CSV for migration
    return await this._findWordsForListFromGCS(listId);
  }

  /**
   * Find words for list from GCS CSV (legacy/migration method)
   * @private
   */
  async _findWordsForListFromGCS(listId) {
    const list = await this.findListById(listId);
    if (!list) return [];

    const csvFile = list.csvFile || `${list.id}.csv`;

    // download file buffer from GCS using GCSClient
    const buf = await gcsClient.downloadFile(csvFile);
    const csvText = buf.toString("utf-8");

    const rows = parseCsvText(csvText);
    return rows;
  }

  /**
   * Get all categories
   */
  async findAllCategories() {
    return await prisma.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * Legacy search method - keep for backward compatibility
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
}

export default VocabularyRepository;
