/**
 * @file apps/backend/src/modules/word/services/WordService.js
 * @description Core business logic for vocabulary word operations.
 *
 * Clean Architecture: Use Case Layer
 * Orchestrates word CRUD, search, and seed operations.
 * Framework-agnostic — repositories are injected for testability.
 *
 * Responsibilities:
 * - Word CRUD (find, search)
 * - Word seeding from data source
 * - Business rules for word operations
 */

export class WordService {
  /**
   * @param {object} wordRepository - Implementation of IWordRepository
   */
  constructor(wordRepository) {
    this.wordRepository = wordRepository;
  }

  /**
   * Get all vocabulary words
   * @returns {Promise<Array>} All words
   */
  async findAll() {
    return this.wordRepository.findAll();
  }

  /**
   * Find word by ID
   * @param {string} id - Word identifier
   * @returns {Promise<object|null>} Word or null
   */
  async findById(id) {
    return this.wordRepository.findById(id);
  }

  /**
   * Find words belonging to a list
   * @param {string} listId - List identifier
   * @returns {Promise<Array>} Words in the list
   */
  async findByList(listId) {
    return this.wordRepository.findByList(listId);
  }

  /**
   * Search words with optional filters
   * @param {string} query - Search query
   * @param {object} [filters] - Search filters
   * @returns {Promise<Array>} Matching words
   */
  async search(query, filters) {
    return this.wordRepository.search(query, filters || {});
  }

  /**
   * Find multiple words by IDs (batch operation)
   * @param {string[]} wordIds - Array of word IDs
   * @returns {Promise<Array>} Words with categories
   */
  async findByIds(wordIds) {
    return this.wordRepository.findByIds(wordIds);
  }

  /**
   * Find unlearned words (not in learned set)
   * @param {string[]} learnedWordIds - Already learned word IDs
   * @param {number} limit - Maximum words to return
   * @returns {Promise<Array>} Unlearned words
   */
  async findUnlearnedWords(learnedWordIds, limit = 10) {
    return this.wordRepository.findUnlearnedWords(learnedWordIds, limit);
  }
}

export default WordService;
