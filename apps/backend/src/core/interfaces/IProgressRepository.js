/**
 * IProgressRepository interface
 * Repository contract for user progress data access
 *
 * Implementations should handle:
 * - CRUD operations for progress records
 * - User/word-based queries
 * - Batch operations with transactions
 */

/**
 * @typedef {Object} Progress
 * @property {string} userId - User identifier
 * @property {string} wordId - Word identifier
 * @property {number} studyCount - Number of times studied
 * @property {number} correctCount - Number of correct attempts
 * @property {number} confidence - Confidence score (0.0 - 1.0)
 * @property {Date} nextReview - Next review date
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} IProgressRepository
 * @property {function(string): Promise<Progress[]>} findByUser - Get all progress for a user
 * @property {function(string, string): Promise<Progress|null>} findByUserAndWord - Get progress for specific word
 * @property {function(string, string, Partial<Progress>): Promise<Progress>} upsert - Create or update progress
 * @property {function(Object): Promise<Progress[]>} findMany - Query with filters
 * @property {function(string, string): Promise<void>} deleteByUserAndWord - Delete progress record
 */

export default {};
