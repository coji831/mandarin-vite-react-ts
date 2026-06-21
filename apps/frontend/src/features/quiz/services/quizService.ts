/**
 * quizService.ts
 * Phase 1 Gate Quiz — Quiz service
 *
 * Provides quiz question generation (local fallback) and
 * backend API integration for quiz attempts, answers, and phase gates.
 *
 * Story 18.6: Added real backend API calls for persistence.
 */

import { apiClient } from "../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { QuizAttempt, PhaseGate } from "@mandarin/shared-types";
import type { StrategyType, QuizQuestion, QuizAnswer, GateQuizResult } from "../types";
import { getStrategy } from "../engine/strategies";

class QuizService {
  /**
   * Generate a question pool using the registered strategy.
   * Falls back to local strategy-based generation when backend is unavailable.
   */
  async generateQuestionPool(strategyType: StrategyType): Promise<QuizQuestion[]> {
    const strategy = getStrategy(strategyType);
    if (!strategy) {
      console.warn(`[quizService] Unknown strategy: ${strategyType}`);
      return [];
    }
    return strategy.generateQuestions();
  }

  // ─── Backend API calls ─────────────────────────────────────────────────

  /**
   * Create a new quiz attempt via backend.
   */
  async createQuizAttempt(quizType: string, phase: number = 1): Promise<QuizAttempt> {
    const response = await apiClient.post(ROUTE_PATTERNS.quizAttempts, {
      quizType,
      phase,
    });
    return response.data;
  }

  /**
   * Submit an answer for the current question.
   */
  async submitAnswer(
    attemptId: string,
    data: {
      questionIndex: number;
      pinyinInput: string;
      selectedTone: number;
      correctPinyin: string;
      correctTone: number;
      category: string;
    },
  ): Promise<QuizAnswer> {
    const response = await apiClient.post(ROUTE_PATTERNS.quizAttemptAnswer(attemptId), data);
    return response.data;
  }

  /**
   * Complete the quiz attempt and get results.
   */
  async completeQuizAttempt(attemptId: string): Promise<GateQuizResult> {
    const response = await apiClient.put(ROUTE_PATTERNS.quizAttemptComplete(attemptId));
    return response.data;
  }

  /**
   * Get user's quiz history.
   */
  async getQuizAttempts(): Promise<QuizAttempt[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.quizAttempts);
    return response.data;
  }

  /**
   * Get or create phase gate.
   */
  async getPhaseGate(): Promise<PhaseGate> {
    const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
    return response.data;
  }

  /**
   * Update phase gate after passing a quiz.
   */
  async updatePhaseGate(
    phase: number,
    passed: boolean,
    gateCriteria: string = "quiz",
  ): Promise<PhaseGate> {
    const response = await apiClient.put(ROUTE_PATTERNS.progressionPhaseGate, {
      phase,
      passed,
      gateCriteria,
    });
    return response.data;
  }
}

export const quizService = new QuizService();
