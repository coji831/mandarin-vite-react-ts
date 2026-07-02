/**
 * @file apps/backend/src/modules/quiz/services/QuizService.ts
 * Generic quiz service — delegates question generation and answer validation
 * to the registered strategy for the given quizType.
 * Cross-module: calls ProgressionService.updatePhaseGate() on pass.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { getStrategy, getRegisteredTypes } from "../strategies/index.js";

const logger = createLogger("QuizService");

import type { QuizAttempt, QuizAttemptAnswer } from "@prisma/client";

/**
 * Quiz strategy interface — describes configuration and question generation.
 */
interface QuizStrategy {
  type: string;
  questionCount: number;
  passThreshold: number;
  timeLimitMinutes?: number;
  tierRules?: Record<string, { passThreshold?: number }>;
  generateQuestions(userId?: string): Promise<unknown[]>;
}

/**
 * Quiz session data returned after creating/loading a session.
 */
interface QuizSessionData {
  attemptId: string;
  quizType: string;
  phase: number;
  questions: unknown[];
  startedAt: Date;
}

/**
 * Result data for a single quiz question.
 */
interface QuestionResult {
  questionIndex: number;
  correct: boolean;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  category: string;
}

interface QuizAnswerInput {
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  category: string;
}

interface EvaluationResult {
  passed: boolean;
  accuracy: number;
  totalScore: number;
  maxScore: number;
}

interface QuizConfig {
  type: string;
  questionCount: number;
  passThreshold: number;
  timeLimitMinutes?: number;
  tierRules: Record<string, { passThreshold?: number }> | null;
}

interface IQuizRepository {
  createQuizAttempt(data: Record<string, unknown>): Promise<QuizAttempt>;
  createQuizAttemptAnswer(data: Record<string, unknown>): Promise<QuizAttemptAnswer>;
  findQuizAttemptAnswers(attemptId: string): Promise<QuizAttemptAnswer[]>;
  findQuizAttemptById(attemptId: string): Promise<QuizAttempt | null>;
  completeQuizAttempt(attemptId: string, data: Record<string, unknown>): Promise<QuizAttempt>;
  findQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
}

interface IProgressionService {
  updatePhaseGate(
    userId: string,
    params: { phase: number; passed: boolean; gateCriteria: string },
  ): Promise<unknown>;
}

export class QuizService {
  private quizRepository: IQuizRepository;
  private progressionService: IProgressionService;

  constructor(quizRepository: IQuizRepository, progressionService: IProgressionService) {
    if (!quizRepository) throw new Error("QuizService requires quizRepository");
    this.quizRepository = quizRepository;
    this.progressionService = progressionService;
  }

  async createQuizAttempt(
    userId: string,
    quizType: string,
    phase: number = 1,
  ): Promise<QuizAttempt> {
    if (!quizType) throw new Error("quizType is required");
    return this.quizRepository.createQuizAttempt({ userId, quizType, phase });
  }

  async submitAnswer(attemptId: string, data: QuizAnswerInput): Promise<QuizAttemptAnswer> {
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

  /**
   * Evaluate a quiz attempt against its strategy's pass thresholds.
   */
  evaluateWithStrategy(
    attempt: QuizAttempt,
    strategy: QuizStrategy,
    answers: QuizAttemptAnswer[],
  ): EvaluationResult {
    const totalScore = answers.filter((a) => a.correct).length;
    const maxScore = answers.length;
    const accuracy = maxScore > 0 ? totalScore / maxScore : 0;

    const passThreshold = strategy?.passThreshold ?? 0.9;
    let passed = accuracy >= passThreshold;

    // Check tier rules generically — strategy self-describes its tiers
    if (passed && strategy?.tierRules) {
      for (const [tierCategory, rules] of Object.entries(strategy.tierRules)) {
        const tierAnswers = answers.filter((a) => a.category === tierCategory);
        if (tierAnswers.length > 0) {
          const tierCorrect = tierAnswers.filter((a) => a.correct).length;
          if (tierCorrect < tierAnswers.length * (rules.passThreshold ?? 1.0)) {
            passed = false;
            break;
          }
        }
      }
    }

    return { passed, accuracy, totalScore, maxScore };
  }

  async completeQuizAttempt(attemptId: string): Promise<EvaluationResult> {
    const answers = await this.quizRepository.findQuizAttemptAnswers(attemptId);
    if (!answers || answers.length === 0) throw new Error("No answers found for this quiz attempt");

    const attempt = await this.quizRepository.findQuizAttemptById(attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    // Read pass threshold from the strategy instead of hardcoded if/else
    const strategy = getStrategy(attempt.quizType) as QuizStrategy | undefined;
    const { passed, accuracy, totalScore, maxScore } = this.evaluateWithStrategy(
      attempt,
      strategy!,
      answers,
    );

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

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return this.quizRepository.findQuizAttemptsByUser(userId);
  }

  /**
   * Generate questions for a quiz type by delegating to the registered strategy.
   * @param quizType - e.g., "audio-to-type"
   * @returns array of question configs
   */
  async getQuizConfig(quizType?: string): Promise<QuizConfig | QuizConfig[]> {
    if (quizType) {
      const strategy = getStrategy(quizType) as QuizStrategy | undefined;
      if (!strategy) throw new Error(`Unknown quiz type: ${quizType}`);
      return {
        type: strategy.type,
        questionCount: strategy.questionCount,
        passThreshold: strategy.passThreshold,
        timeLimitMinutes: strategy.timeLimitMinutes,
        tierRules: strategy.tierRules || null,
      };
    }
    // Return all registered strategies
    const types = getRegisteredTypes();
    return types.map((type: string) => {
      const strategy = getStrategy(type) as QuizStrategy;
      return {
        type: strategy.type,
        questionCount: strategy.questionCount,
        passThreshold: strategy.passThreshold,
        timeLimitMinutes: strategy.timeLimitMinutes,
        tierRules: strategy.tierRules || null,
      };
    });
  }

  async generateQuestions(quizType: string, count: number = 20): Promise<unknown[]> {
    const strategy = getStrategy(quizType) as QuizStrategy | undefined;
    if (!strategy) throw new Error(`Unknown quiz type: ${quizType}`);
    const pool = await strategy.generateQuestions(/*userId*/);
    return pool.slice(0, count);
  }
}
