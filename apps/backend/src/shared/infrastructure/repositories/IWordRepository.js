/**
 * @file apps/backend/src/shared/infrastructure/repositories/IWordRepository.js
 * @description Repository interface for word data access
 *
 * Implementations should handle:
 * - Fetching vocabulary words from the database
 * - Searching words by criteria
 * - Batch word lookups
 */

/**
 * @typedef {Object} WordData
 * @property {string} id - Word identifier
 * @property {string} simplified - Simplified Chinese characters
 * @property {string} traditional - Traditional Chinese characters
 * @property {string} pinyin - Pinyin romanization
 * @property {string} english - English translation
 * @property {number} [hskLevel] - HSK level (1-6)
 */

/**
 * @typedef {Object} WordSearchFilters
 * @property {string[]} [categories] - Filter by category names
 * @property {string[]} [lists] - Filter by list IDs
 * @property {number} [limit=50] - Maximum results
 * @property {number} [offset=0] - Pagination offset
 */

/**
 * @typedef {Object} IWordRepository
 * @property {() => Promise<WordData[]>} findAll - Get all vocabulary words
 * @property {(id: string) => Promise<WordData|null>} findById - Find word by ID
 * @property {(listId: string) => Promise<WordData[]>} findByList - Find words belonging to a list
 * @property {(query: string, filters?: WordSearchFilters) => Promise<WordData[]>} search - Search words with optional filters
 */
