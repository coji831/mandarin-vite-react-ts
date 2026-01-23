/**
 * @file apps/backend/src/infrastructure/repositories/VocabularyRepository.js
 * @description Infrastructure implementation that retrieves vocabulary lists and CSVs from GCS
 * Clean architecture: implements IVocabularyRepository interface
 */

import * as gcsClient from "../external/GCSClient.js";
import { vocabularyConfig } from "../../config/vocabulary.js";
import { parseCsvText } from "../parsers/CsvParser.js";

/**
 * VocabularyRepository
 * Infrastructure implementation that retrieves vocabulary lists and CSVs from GCS.
 *
 * Notes:
 * - Uses a simple in-memory cache for `vocabularyLists.json`. For multi-node
 *   deployments, consider moving this cache to Redis (shared cache).
 * - Expected `vocabularyLists.json` shape:
 *   [{ id, name, description, difficulty, tags, csvFile }, ...]
 */
export class VocabularyRepository {
  constructor() {
    // in-memory cache of the lists file
    this._listsCache = null;
    this._cacheTs = 0;
  }

  /**
   * findAllLists
   * Fetch the `vocabularyLists.json` from GCS and cache it.
   */
  async findAllLists() {
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
   * findListById
   * Convenience method that searches the cached lists for a single list.
   */
  async findListById(listId) {
    const lists = await this.findAllLists();
    return lists.find((l) => l.id === listId) || null;
  }

  /**
   * findWordsForList
   * Fetch and parse the CSV associated with a list from GCS.
   * The CSV filename is taken from `list.csvFile` or falls back to `<listId>.csv`.
   */
  async findWordsForList(listId) {
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
   * searchLists
   * Basic filtering by query, difficulty, and tags. Keep simple for now;
   * consider full-text search or an indexed search service if needs grow.
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
