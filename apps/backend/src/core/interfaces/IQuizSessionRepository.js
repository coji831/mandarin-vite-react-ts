/**
 * IQuizSessionRepository interface
 * Repository contract for quiz session data access
 *
 * Clean Architecture: Core Layer — Port (Interface)
 * This file lives in core/ and defines the abstraction (port) that
 * services depend on. Infrastructure repositories implement this contract.
 * The Dependency Rule: core/ NEVER imports from infrastructure/.
 *
 * Implementations:
 * - QuizSessionRepository (src/infrastructure/repositories/QuizSessionRepository.js)
 *
 * Docs: docs/architecture.md § Infrastructure Layer — Repositories
 */

/**
 * @typedef {Object} QuizSessionData
 * @property {string} id - Session identifier
 * @property {string} userId - Owner user identifier
 * @property {Array}  questions - Ordered array of QuizSessionQuestion objects
 * @property {number} currentIndex - Index of the current unanswered question
 * @property {string} status - Lifecycle status (ACTIVE | COMPLETE | EXPIRED)
 * @property {Date}   startedAt - Session creation timestamp
 * @property {Date}   expiresAt - Daily window expiration — midnight end-of-day, set at session creation (single source of truth)
 * @property {Date|null} completedAt - Completion timestamp (null while active)
 */

/**
 * @typedef {Object} IQuizSessionRepository
 * @property {function(object): Promise<QuizSessionData>}           create                  - Create a new quiz session with questions
 * @property {function(string): Promise<QuizSessionData|null>}      findById                - Find session by ID (no auth check)
 * @property {function(string, string): Promise<QuizSessionData|null>} findByIdAndUserId    - Find session by ID + userId (authorization composite lookup)
 * @property {function(string): Promise<QuizSessionData|null>}      findLatestByUserId      - Find the most recent session for a user (any status) — single-session model
 * @property {function(string): Promise<QuizSessionData|null>}      findActiveByUser        - Find non-expired ACTIVE session for a user
 * @property {function(string, object): Promise<QuizSessionData>}   update                  - Update mutable session fields (status, currentIndex, completedAt); expiresAt is immutable after creation
 * @property {function(string): Promise<number>}                    deleteAllForUser        - Delete all sessions for a user (cascade: questions, answers, summary); single-session cleanup
 */

export default {};
