/**
 * @file apps/backend/src/infrastructure/repositories/VocabularyRepository.js
 * @description Infrastructure implementation that retrieves vocabulary from database and GCS
 * Clean architecture: implements IVocabularyRepository interface
 * 
 * Story 15-2: Enhanced to use normalized database schema (VocabularyWord, Category, VocabularyList)
 */

import * as gcsClient from "../external/GCSClient.js";
import { vocabularyConfig } from "../../config/vocabulary.js";
import { parseCsvText } from "../parsers/CsvParser.js";
import { prisma } from "../database/client.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("VocabularyRepository");

/**
 * VocabularyRepository
 * Infrastructure implementation that retrieves vocabulary from database and GCS.
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
   * Find word by ID (for progress enrichment)
   * Story 15-2: Primary method for quiz system
   */
  async findById(wordId) {
    return await prisma.vocabularyWord.findUnique({
      where: { id: wordId },
      include: {
        categories: {
          include: { category: true }
        },
        lists: {
          include: { list: { select: { name: true, difficulty: true } } },
          take: 3  // Limit to avoid excessive data
        }
      }
    });
  }

  /**
   * Find multiple words by IDs (batch operation)
   * Story 15-2: Optimized for due words enrichment
   */
  async findByIds(wordIds) {
    if (!wordIds || wordIds.length === 0) return [];
    
    return await prisma.vocabularyWord.findMany({
      where: { id: { in: wordIds } },
      include: {
        categories: {
          include: { category: { select: { name: true } } }
        }
      }
    });
  }

  /**
   * Find all vocabulary lists (database)
   */
  async findAllLists() {
    // Try database first
    const dbLists = await prisma.vocabularyList.findMany({
      where: { isPublic: true },
      orderBy: { name: 'asc' }
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
      where: { id: listId }
    });
    
    if (dbList) {
      return dbList;
    }
    
    // Fallback to GCS
    const lists = await this._findAllListsFromGCS();
    return lists.find((l) => l.id === listId) || null;
  }

  /**
   * Find words for a list (replaces CSV loading)
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
                  include: { category: true }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (listWithWords) {
      return listWithWords.words.map(wl => ({
        ...wl.word,
        sortOrder: wl.sortOrder
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
   * Search words across vocabulary
   * Story 15-2: Database-powered search
   */
  async searchWords(query, filters = {}) {
    const whereClause = {
      AND: [
        // Text search
        query ? {
          OR: [
            { pinyin: { contains: query, mode: 'insensitive' } },
            { simplified: { contains: query } },
            { traditional: { contains: query } },
            { english: { contains: query, mode: 'insensitive' } }
          ]
        } : {},
        
        // Category filter
        filters.categories?.length ? {
          categories: {
            some: {
              category: { name: { in: filters.categories } }
            }
          }
        } : {},
        
        // List filter
        filters.lists?.length ? {
          lists: {
            some: {
              list: { id: { in: filters.lists } }
            }
          }
        } : {}
      ]
    };

    return await prisma.vocabularyWord.findMany({
      where: whereClause,
      include: {
        categories: { include: { category: true } },
        lists: { 
          include: { list: { select: { name: true, difficulty: true } } },
          take: 2
        }
      },
      take: filters.limit || 50,
      skip: filters.offset || 0
    });
  }

  /**
   * Find words by category
   */
  async findWordsByCategory(categoryName) {
    const category = await prisma.category.findUnique({
      where: { name: categoryName },
      include: {
        words: {
          include: { word: true }
        }
      }
    });

    return category?.words.map(wc => wc.word) || [];
  }

  /**
   * Get all categories
   */
  async findAllCategories() {
    return await prisma.category.findMany({
      orderBy: { displayOrder: 'asc' }
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

