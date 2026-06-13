/**
 * VocabularyListService
 * Core business logic for vocabulary list and category operations.
 *
 * Clean Architecture: Use Case Layer
 * Orchestrates list/category operations. Framework-agnostic — repositories are injected.
 *
 * Responsibilities:
 * - List CRUD operations
 * - Category lookups
 * - List search with filtering
 * - Metadata extraction (difficulties, tags)
 */

export class VocabularyListService {
  /**
   * @param {object} listRepository - Implementation of list repository
   */
  constructor(listRepository) {
    this.listRepository = listRepository;
  }

  /**
   * Get all vocabulary lists
   * @returns {Promise<Array>} All lists
   */
  async getAllLists() {
    return this.listRepository.findAllLists();
  }

  /**
   * Get list by ID
   * @param {string} listId - List identifier
   * @returns {Promise<object|null>} List or null
   */
  async getListById(listId) {
    return this.listRepository.findListById(listId);
  }

  /**
   * Get words for a list
   * @param {string} listId - List identifier
   * @returns {Promise<Array>} Words in the list
   */
  async getWordsForList(listId) {
    return this.listRepository.findWordsForList(listId);
  }

  /**
   * Search lists with optional filters
   * @param {string} query - Search query
   * @param {object} [filters] - Search filters
   * @returns {Promise<Array>} Matching lists
   */
  async searchLists(query, filters) {
    return this.listRepository.searchLists(query, filters || {});
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} All categories
   */
  async getAllCategories() {
    return this.listRepository.findAllCategories();
  }

  /**
   * Extract distinct difficulties from lists
   * @param {Array} lists - Array of list objects
   * @returns {string[]} Distinct difficulty values
   */
  extractDistinctDifficulties(lists) {
    const set = new Set();
    lists.forEach((l) => set.add(l.difficulty));
    return Array.from(set);
  }

  /**
   * Extract distinct tags from lists
   * @param {Array} lists - Array of list objects
   * @returns {string[]} Distinct tag values
   */
  extractDistinctTags(lists) {
    const set = new Set();
    lists.forEach((l) => (l.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }
}

export default VocabularyListService;
