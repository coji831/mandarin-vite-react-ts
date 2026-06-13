/**
 * IQuizSessionAnswerRepository interface
 * Repository contract for per-answer records within a quiz session
 *
 * Clean Architecture: Domain Layer — Port (Interface)
 * This file defines the abstraction (port) that use-cases depend on.
 * Repositories in the repositories/ layer implement this contract.
 * The Dependency Rule: domain/ NEVER imports from infrastructure/.
 *
 * Implementations:
 * - QuizSessionAnswerRepository (modules/quiz/repositories/QuizSessionAnswerRepository.js)
 *
 * Design note: Each row corresponds to one answered question in a session.
 * Word context (hanzi, pinyin, etc.) is not stored here — it is read from the
 * related QuizSessionQuestion row via the questionId FK.
 */

/**
 * @typedef {Object} QuizSessionAnswerData
 * @property {string}      id             - Answer identifier
 * @property {string}      sessionId      - Quiz session identifier (FK)
 * @property {string}      userId         - User identifier
 * @property {string}      wordId         - Vocabulary word identifier
 * @property {string}      questionId     - FK to QuizSessionQuestion.id (@unique — one answer per question)
 * @property {string}      userAnswer     - The raw string the user submitted
 * @property {boolean}     correct        - Whether the answer was marked correct
 * @property {number|null} timeSpentMs    - Time spent answering (ms); null if not tracked
 * @property {number}      lapseCount     - Consecutive failure count used by SRS algorithm
 * @property {boolean}     isLeech        - True when lapseCount >= leech threshold
 * @property {Date|null}   nextReviewDate - Next scheduled SRS review date
 * @property {Date}        answeredAt     - Answer submission timestamp
 * @property {object}      [question]     - Nested QuizSessionQuestion (present when joined)
 */

/**
 * @typedef {Object} IQuizSessionAnswerRepository
 * @property {function(object): Promise<QuizSessionAnswerData>}           create                   - Record a new per-question answer
 * @property {function(string): Promise<QuizSessionAnswerData[]>}         findBySession            - All answers for a session, ordered by question index (joins QuizSessionQuestion)
 * @property {function(string): Promise<QuizSessionAnswerData|null>} findByQuestionId - Lookup by questionId for duplicate-answer guard (@unique constraint)
 * @property {function(string, number=): Promise<QuizSessionAnswerData[]>} findRecentByUser        - N most recent answers for a user across all sessions (streak freeze check)
 */

export default {};
