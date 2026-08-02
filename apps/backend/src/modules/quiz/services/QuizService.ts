/**
 * @file apps/backend/src/modules/quiz/services/QuizService.ts
 * Generic quiz service — delegates question generation and answer validation
 * to the registered strategy for the given quizType.
 * Cross-module: calls ProgressionService.updatePhaseGate() on pass.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { getStrategy, getRegisteredTypes } from "../strategies/index.js";
import {
  isSandhiAcceptable,
  areTonesEquivalent,
  normalizePinyinForComparison,
} from "@mandarin/shared-utils";
import type { QuizStrategy } from "../types/quiz.js";

const logger = createLogger("QuizService");

import type { QuizAttempt, QuizAttemptAnswer } from "@prisma/client";

interface QuizAnswerInput {
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  category: string;
  isSandhiQuestion?: boolean;
  sandhiRule?: string;
}

interface EvaluationResult {
  passed: boolean;
  accuracy: number;
  totalScore: number;
  maxScore: number;
  /** Correct answers per category — sum always equals totalScore. */
  categoryBreakdown: CategoryBreakdown;
}

/** Per-category correct counts, keyed by the question's `category` value. */
interface CategoryBreakdown {
  pinyin: number;
  tones: number;
  pairs: number;
  rules: number;
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
  findQuizAttemptByUserAndType(userId: string, quizType: string): Promise<QuizAttempt | null>;
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
    metadata?: unknown,
    passageId?: string | null,
  ): Promise<QuizAttempt> {
    if (!quizType) throw new Error("quizType is required");
    return this.quizRepository.createQuizAttempt({
      userId,
      quizType,
      phase,
      metadata,
      passageId,
    });
  }

  async submitAnswer(attemptId: string, data: QuizAnswerInput): Promise<QuizAttemptAnswer> {
    const {
      questionIndex,
      pinyinInput,
      selectedTone,
      correctPinyin,
      correctTone,
      category,
      isSandhiQuestion,
      sandhiRule,
    } = data;
    // G2: neutral tone (轻声) is canonically 0 but lexical data may store it
    // as 5 — treat them as equivalent (0 === 5 for neutral).
    const toneCorrect = areTonesEquivalent(selectedTone, correctTone);
    const sandhiAccepted = isSandhiAcceptable(
      correctTone,
      selectedTone,
      isSandhiQuestion,
      sandhiRule,
    );
    // G9: accept both digitless ("xiang") and digit-suffixed ("xiang4") pinyin,
    // plus tone-marked input; NFKC-normalize (IME glyphs, full-width input).
    const pinyinCorrect =
      normalizePinyinForComparison(pinyinInput) === normalizePinyinForComparison(correctPinyin);
    const correct = pinyinCorrect && (toneCorrect || sandhiAccepted);
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

    return { passed, accuracy, totalScore, maxScore, categoryBreakdown: this.computeCategoryBreakdown(answers) };
  }

  /**
   * Attribute each correct answer to its category and count per category.
   * Every question carries exactly one category (e.g. "pinyin" | "tones" for
   * audio-to-pinyin-tone quizzes), so the breakdown sums to `totalScore` —
   * no question falls through the breakdown.
   */
  private computeCategoryBreakdown(answers: QuizAttemptAnswer[]): CategoryBreakdown {
    const breakdown: CategoryBreakdown = { pinyin: 0, tones: 0, pairs: 0, rules: 0 };
    for (const answer of answers) {
      if (!answer.correct) continue;
      if (answer.category in breakdown) {
        breakdown[answer.category as keyof CategoryBreakdown] += 1;
      }
    }
    return breakdown;
  }

  async completeQuizAttempt(attemptId: string): Promise<EvaluationResult> {
    const answers = await this.quizRepository.findQuizAttemptAnswers(attemptId);
    if (!answers || answers.length === 0) throw new Error("No answers found for this quiz attempt");

    const attempt = await this.quizRepository.findQuizAttemptById(attemptId);
    if (!attempt) throw new Error("Quiz attempt not found");

    // Read pass threshold from the strategy instead of hardcoded if/else
    const strategy = getStrategy(attempt.quizType);
    const { passed, accuracy, totalScore, maxScore, categoryBreakdown } =
      this.evaluateWithStrategy(attempt, strategy!, answers);

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

    return { totalScore, maxScore, passed, accuracy, categoryBreakdown };
  }

  async getUserQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    return this.quizRepository.findQuizAttemptsByUser(userId);
  }

  /**
   * Get the comprehension quiz result for a user and passage.
   * Looks up the latest QuizAttempt with quizType = "comprehension" for the user,
   * verifies it matches the given passageId, and returns the score ratio.
   * Returns null if no matching attempt exists.
   *
   * @param userId - User ID
   * @param passageId - Passage ID to match
   * @returns Score object with ratio, or null if no attempt found
   */
  async getComprehensionQuizResult(
    userId: string,
    passageId: string,
  ): Promise<{ score: number } | null> {
    const attempt = await this.quizRepository.findQuizAttemptByUserAndType(userId, "comprehension");
    if (!attempt || attempt.passageId !== passageId) return null;

    const maxScore = attempt.maxScore > 0 ? attempt.maxScore : 1;
    return { score: attempt.totalScore / maxScore };
  }

  /**
   * Generate questions for a quiz type by delegating to the registered strategy.
   * @param quizType - e.g., "audio-to-type"
   * @returns array of question configs
   */
  async getQuizConfig(quizType?: string): Promise<QuizConfig | QuizConfig[]> {
    if (quizType) {
      const strategy = getStrategy(quizType);
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
      const strategy = getStrategy(type)!;
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
    const strategy = getStrategy(quizType);
    if (!strategy) throw new Error(`Unknown quiz type: ${quizType}`);
    const pool = await strategy.generateQuestions(/*userId*/);
    return pool.slice(0, count);
  }
}
