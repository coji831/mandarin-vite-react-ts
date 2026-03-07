/**
 * @file QuizSession.js
 * @description QuizSession aggregate root - Domain entity for quiz session management
 * 
 * Clean Architecture: Domain Layer - Core business entity
 * Encapsulates quiz session business logic and invariants
 * 
 * Responsibilities:
 * - Maintain quiz session state and business rules
 * - Sanitize questions for client (security)
 * - Track session progress and completion
 * - Enforce session lifecycle rules (1-hour expiration)
 */

export class QuizSession {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.questions = data.questions || [];
    this.answers = data.answers || [];
    this.currentIndex = data.currentIndex || 0;
    this.status = data.status || 'ACTIVE';
    this.startedAt = data.startedAt || new Date();
    this.expiresAt = data.expiresAt;
    this.completedAt = data.completedAt;
  }

  /**
   * Check if session is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.currentIndex >= this.questions.length;
  }

  /**
   * Check if session is expired
   * @returns {boolean}
   */
  isExpired() {
    return new Date() > this.expiresAt;
  }

  /**
   * Get current question
   * @returns {object|null}
   */
  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentIndex];
  }

  /**
   * Advance to next question
   * Business rule: Cannot advance past last question
   */
  advanceToNext() {
    if (this.currentIndex < this.questions.length) {
      this.currentIndex++;
    }
  }

  /**
   * Mark session as completed
   */
  markCompleted() {
    this.status = 'COMPLETED';
    this.completedAt = new Date();
  }

  /**
   * Sanitize questions for client response (Security)
   * 
   * Business rules:
   * - Never expose correct answers to client (prevents cheating)
   * - Omit pinyin for type_pinyin questions (answer protection)
   * - Omit english for multiple_choice questions (answer protection)
   * 
   * @param {Array<object>} questions - Questions to sanitize
   * @returns {Array<object>} Sanitized questions safe for client
   */
  static sanitizeQuestionsForClient(questions) {
    return questions.map((q) => ({
      id: q.id,
      wordId: q.wordId,
      questionType: q.questionType,
      word: {
        id: q.word.id,
        simplified: q.word.simplified,
        traditional: q.word.traditional,
        // Security: Omit pinyin for type_pinyin (user must recall it)
        ...(q.questionType !== 'type_pinyin' && { pinyin: q.word.pinyin }),
        // Security: Omit english for multiple_choice (user must select from options)
        ...(q.questionType !== 'multiple_choice' && { english: q.word.english }),
      },
      // Security: correctAnswer NEVER sent to client
    }));
  }

  /**
   * Get sanitized questions for this session
   * @returns {Array<object>}
   */
  getSanitizedQuestions() {
    return QuizSession.sanitizeQuestionsForClient(this.questions);
  }

  /**
   * Calculate session accuracy
   * @returns {number} Accuracy percentage (0-100)
   */
  calculateAccuracy() {
    if (this.answers.length === 0) return 0;
    const correctCount = this.answers.filter(a => a.correct).length;
    return Math.round((correctCount / this.answers.length) * 100);
  }

  /**
   * Get session summary
   * @returns {object}
   */
  getSummary() {
    const correctCount = this.answers.filter(a => a.correct).length;
    const totalCount = this.answers.length;
    
    return {
      sessionId: this.id,
      totalQuestions: this.questions.length,
      questionsAnswered: this.answers.length,
      correctCount,
      incorrectCount: totalCount - correctCount,
      accuracyRate: this.calculateAccuracy(),
      status: this.status,
      completedAt: this.completedAt,
    };
  }
}
