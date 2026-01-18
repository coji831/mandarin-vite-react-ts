/**
 * IVocabularyRepository interface
 * Repository contract for vocabulary data access
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
 * @property {string} difficulty - Difficulty level
 * @property {string[]} tags - Associated tags
 * @property {string} csvFile - CSV filename
 */

/**
 * @typedef {Object} Word
 * @property {string} wordId - Word identifier
 * @property {string} chinese - Chinese characters
 * @property {string} pinyin - Pinyin romanization
 * @property {string} english - English translation
 */

/**
 * @typedef {Object} IVocabularyRepository
 * @property {function(): Promise<VocabularyList[]>} findAllLists - Get all vocabulary lists
 * @property {function(string): Promise<VocabularyList|null>} findListById - Get specific list
 * @property {function(string): Promise<Word[]>} findWordsForList - Get words for a list
 * @property {function(string, Object): Promise<VocabularyList[]>} searchLists - Search with filters
 */

export default {};
