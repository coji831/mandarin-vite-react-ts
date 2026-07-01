/**
 * quizService.ts
 * Phase 1 Gate Quiz — Quiz service
 *
 * Provides quiz question generation (local fallback) and
 * backend API integration for quiz attempts, answers, and phase gates.
 *
 * Story 18.6: Added real backend API calls for persistence.
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { QuizAttempt, PhaseGate } from "@mandarin/shared-types";
import type { StrategyType, QuizQuestion, QuizAnswer, GateQuizResult } from "../types";
import { getStrategy } from "../engine/strategies";

class QuizService {
  /**
   * Generate a question pool using the registered strategy.
   * Falls back to local strategy-based generation when backend is unavailable.
   */
  async generateQuestionPool(strategyType: StrategyType, count?: number): Promise<QuizQuestion[]> {
    const strategy = getStrategy(strategyType);
    if (!strategy) {
      console.warn("[QuizService] Unknown strategy:", strategyType);
      return [];
    }
    return strategy.generateQuestions(count);
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
   * Fetch quiz config from backend (source of truth for question count, thresholds, timer).
   */
  async getQuizConfig(quizType: string): Promise<{
    type: string;
    questionCount: number;
    passThreshold: number;
    timeLimitMinutes: number;
    tierRules: Record<string, { passThreshold: number }> | null;
  }> {
    const response = await apiClient.get(ROUTE_PATTERNS.quizConfig, {
      params: { type: quizType },
    });
    return response.data;
  }

  /**
   * Fetch questions by type and count from the backend.
   */
  async fetchQuestions(type: string, count: number): Promise<QuizQuestion[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.quizQuestions, {
      params: { type, count },
    });
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
