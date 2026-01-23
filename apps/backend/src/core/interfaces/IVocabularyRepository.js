/**
 * @file apps/backend/src/core/interfaces/IVocabularyRepository.js
 * @description Repository interface for vocabulary data access
 *
 * Implementations should handle:
 * - Fetching vocabulary lists (from GCS or local)
 * - Fetching words for a list (CSV parsing)
 * - Search and filtering operations
 * - Caching strategies
 */

/**
 * @typedef {Object} VocabularyList
 * @property {string} id - List identifier
 * @property {string} name - List name
 * @property {string} description - List description
 * @property {string} difficulty - Difficulty level (beginner, intermediate, advanced)
 * @property {string[]} tags - Associated tags
 * @property {string} csvFile - CSV filename in GCS bucket
 */

/**
 * @typedef {Object} Word
 * @property {string} wordId - Word identifier
 * @property {string} chinese - Chinese characters
 * @property {string} pinyin - Pinyin romanization
 * @property {string} english - English translation
 */

/**
 * @typedef {Object} SearchFilters
 * @property {string[]} [difficulties] - Filter by difficulty levels
 * @property {string[]} [tags] - Filter by tags
 */

/**
 * @typedef {Object} IVocabularyRepository
 * @property {() => Promise<VocabularyList[]>} findAllLists - Get all vocabulary lists
 * @property {(listId: string) => Promise<VocabularyList|null>} findListById - Get specific list by ID
 * @property {(listId: string) => Promise<Word[]>} findWordsForList - Get all words for a specific list
 * @property {(query: string, filters?: SearchFilters) => Promise<VocabularyList[]>} searchLists - Search lists with optional filters
 */
