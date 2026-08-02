/**
 * @file services/sandhiDrillService.ts
 * @description API service layer for Sandhi Drill (Story 21.17)
 *
 * Provides functions to fetch sandhi drill questions from the backend,
 * calculate scores with per-rule breakdowns, and submit quiz attempts.
 */

import { apiClient } from "shared/api";

// ─── Types ──────────────────────────────────────────────────────────────

export interface DrillQuestion {
  id: string;
  characters: string;
  dictionaryPinyin: string;
  correctAnswer: string;
  ruleId: string;
  options: string[];
}

export interface SandhiAnswer {
  questionId: string;
  selected: string;
  correctAnswer: string;
  ruleId: string;
}

export interface RuleScore {
  correct: number;
  total: number;
}

export interface SandhiDrillResult {
  score: number;
  total: number;
  ruleScores: Record<string, RuleScore>;
}

// ─── API Calls ──────────────────────────────────────────────────────────

/**
 * Fetch sandhi drill questions from the backend.
 * @param count - Number of questions to fetch (clamped server-side to 5-25)
 */
export async function getSandhiDrillQuestions(count: number = 10): Promise<DrillQuestion[]> {
  const response = await apiClient.get(`/v1/quiz/sandhi-drill/questions?count=${count}`, {
    timeout: 10000,
  });
  return response.data;
}

/**
 * Calculate overall score + per-rule breakdown from user answers.
 */
export function calculateScore(answers: SandhiAnswer[]): SandhiDrillResult {
  const ruleScores: Record<string, RuleScore> = {};
  let correctCount = 0;

  for (const answer of answers) {
    if (!ruleScores[answer.ruleId]) {
      ruleScores[answer.ruleId] = { correct: 0, total: 0 };
    }
    ruleScores[answer.ruleId].total += 1;

    if (answer.selected === answer.correctAnswer) {
      ruleScores[answer.ruleId].correct += 1;
      correctCount += 1;
    }
  }

  return {
    score: correctCount,
    total: answers.length,
    ruleScores,
  };
}

/**
 * Submit a sandhi drill attempt result to the backend.
 */
export async function submitSandhiDrillAttempt(
  score: number,
  total: number,
  ruleScores: Record<string, RuleScore>,
): Promise<void> {
  await apiClient.post(
    "/v1/quiz/attempts",
    {
      quizType: "sandhi-drill",
      score,
      total,
      metadata: { ruleScores },
    },
    { timeout: 10000 },
  );
}
