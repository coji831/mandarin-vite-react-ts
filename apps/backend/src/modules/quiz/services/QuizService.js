/**
 * @file apps/backend/src/modules/quiz/services/QuizService.js
 * Generic quiz service — delegates question generation and answer validation
 * to the registered strategy for the given quizType.
 * Cross-module: calls ProgressionService.updatePhaseGate() on pass.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { getStrategy } from "../strategies/index.js";

const logger = createLogger("QuizService");

export class QuizService {
  constructor(quizRepository, progressionService) {
    if (!quizRepository) throw new Error("QuizService requires quizRepository");
    this.quizRepository = quizRepository;
    this.progressionService = progressionService;
  }

  async createQuizAttempt(userId, quizType, phase = 1) {
    if (!quizType) throw new Error("quizType is required");
    return this.quizRepository.createQuizAttempt({ userId, quizType, phase });
  }

  async submitAnswer(attemptId, data) {
    const { questionIndex, pinyinInput, selectedTone, correctPinyin, correctTone, category } = data;
    const correct = pinyinInput === correctPinyin && selectedTone === correctTone;
    return this.quizRepository.createQuizAttemptAnswer({
      attemptId,
      questionIndex,
      pinyinInput,
      selectedTone,
      correctPinyin,
      correctTone,
      correct,
      category,
    });
  }

  async completeQuizAttempt(attemptId) {
    const answers = await this.quizRepository.findQuizAttemptAnswers(attemptId);
    if (!answers || answers.length === 0) throw new Error("No answers found for this quiz attempt");

    const totalScore = answers.filter((a) => a.correct).length;
    const maxScore = answers.length;
    const accuracy = maxScore > 0 ? totalScore / maxScore : 0;
    const passed = accuracy >= 0.9;

    const attempt = await this.quizRepository.findQuizAttemptById(attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    await this.quizRepository.completeQuizAttempt(attemptId, { totalScore, maxScore, passed });

    if (passed) {
      try {
        await this.progressionService.updatePhaseGate(attempt.userId, {
          phase: attempt.phase || 1,
          passed: true,
          gateCriteria: "quiz",
        });
      } catch (err) {
        logger.error("Failed to update phase gate", err);
      }
    }

    return { totalScore, maxScore, passed, accuracy };
  }

  async getUserQuizAttempts(userId) {
    return this.quizRepository.findQuizAttemptsByUser(userId);
  }

  /**
   * Generate questions for a quiz type by delegating to the registered strategy.
   * @param {string} quizType - e.g., "audio-to-type"
   * @param {number} count - number of questions to generate (default 20)
   * @returns {Promise<Array>} array of question objects
   */
  async generateQuestions(quizType, count = 20) {
    const strategy = getStrategy(quizType);
    if (!strategy) throw new Error(`Unknown quiz type: ${quizType}`);
    const pool = await strategy.generateQuestions(/*userId*/);
    return pool.slice(0, count);
  }
}
