/**
 * IQuizSessionSummaryRepository interface
 * Repository contract for quiz session summary persistence
 *
 * Clean Architecture: Core Layer — Port (Interface)
 * This file lives in core/ and defines the abstraction (port) that
 * services depend on. Infrastructure repositories implement this contract.
 * The Dependency Rule: core/ NEVER imports from infrastructure/.
 *
 * Implementations:
 * - QuizSessionSummaryRepository (src/infrastructure/repositories/QuizSessionSummaryRepository.js)
 *
 * Design note: Summaries are pre-calculated on session completion and stored
 * with a 7-day TTL. This avoids re-scanning all answers on every summary read.
 * The TTL supports the "Review Mistakes" feature (Story 15.11 Flow 5).
 *
 * Docs: docs/architecture.md § Infrastructure Layer — Repositories
 */

/**
 * @typedef {Object} QuizSessionSummaryData
 * @property {string}   id              - Summary identifier
 * @property {string}   userId          - Owner user identifier
 * @property {string}   sessionId       - Quiz session identifier (@unique)
 * @property {number}   totalQuestions  - Total questions answered in the session
 * @property {number}   correctCount    - Number of correct answers
 * @property {number}   incorrectCount  - Number of incorrect answers (derived)
 * @property {number}   accuracyRate    - Accuracy percentage (0–100)
 * @property {number}   xpEarned        - XP awarded for this session
 * @property {string[]} newBadgeIds     - IDs of badges newly awarded during this session
 * @property {boolean}  mysteryBoxDrop  - Whether a mystery box was awarded
 * @property {string|null} mysteryBoxType - Reward type ('xp_boost' | 'freeze' | 'cosmetic' | null)
 * @property {boolean}  freezeAwarded   - Whether a streak freeze was awarded
 * @property {string[]} leechWordIds    - Word IDs that crossed the leech threshold (lapseCount >= 5)
 * Note: completedAt, expiresAt, and createdAt are stored on QuizSession — all session lifecycle metadata lives there.
 */

/**
 * @typedef {Object} IQuizSessionSummaryRepository
 * @property {function(object): Promise<QuizSessionSummaryData>}           create                    - Persist a newly calculated session summary
 * @property {function(string): Promise<QuizSessionSummaryData|null>}      findBySessionId           - Find summary by session ID (no auth check)
 * @property {function(string, string): Promise<QuizSessionSummaryData|null>} findBySessionIdAndUserId - Find summary by session ID + userId (authorization check)
 * @property {function(string): Promise<number>}                           deleteAllForUser          - Delete all summaries for a user (testing / account cleanup); returns deleted count
 */

export default {};
