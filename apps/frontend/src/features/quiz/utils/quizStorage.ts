/**
 * Quiz Results Storage Utility
 * Story 15.11: Quiz results persistence for mistake review
 *
 * Manages localStorage persistence of quiz session results.
 * Enables "Review Mistakes" feature by storing incorrect words.
 *
 * Storage key: 'mandarin:quizResult'
 * Expiration: 7 days from completion
 *
 * Schema:
 * {
 *   sessionId: string;
 *   completedAt: string (ISO 8601);
 *   expiresAt: string (ISO 8601);
 *   totalWords: number;
 *   correctCount: number;
 *   incorrectCount: number;
 *   accuracyRate: number;
 *   incorrectWords: Array<{
 *     wordId: string;
 *     word: string;
 *     pinyin: string;
 *     english: string;
 *     userAnswer: string;
 *     questionType: string;
 *   }>;
 *   leechWords: string[]; // word IDs with lapseCount >= 5
 * }
 */

import type { QuizAnswer, QuizSessionSummary } from "../types";

// ============================================================================
// Types
// ============================================================================

export interface StoredIncorrectWord {
  wordId: string;
  word: string;
  pinyin: string;
  english: string;
  userAnswer: string;
  questionType: string;
}

export interface StoredQuizResult {
  sessionId: string;
  completedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  accuracyRate: number;
  incorrectWords: StoredIncorrectWord[];
  leechWords: string[]; // word IDs with lapseCount >= 5
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "mandarin:quizResult";
const EXPIRATION_DAYS = 7;

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Save quiz results to localStorage
 * Story 15.11: Accept backend-calculated summary instead of doing client-side calculations
 *
 * @param answers - Array of quiz answers from completed session (for fallback word data)
 * @param summary - Backend-calculated session summary with all metrics
 */
export function saveQuizResult(answers: QuizAnswer[], summary: QuizSessionSummary): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  // Use backend-provided incorrect words data
  const incorrectWords: StoredIncorrectWord[] = summary.incorrectWords.map((word) => ({
    wordId: word.wordId,
    word: word.hanzi,
    pinyin: word.pinyin,
    english: word.english,
    userAnswer: word.userAnswer,
    questionType: word.questionType,
  }));

  const result: StoredQuizResult = {
    sessionId: summary.sessionId,
    completedAt: summary.completedAt,
    expiresAt: expiresAt.toISOString(),
    totalWords: summary.totalQuestions, // Type audit aligned: totalQuestions not totalAnswered
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    accuracyRate: summary.accuracyRate, // Backend-calculated (0-100)
    incorrectWords,
    leechWords: summary.leechWordIds, // Backend-calculated (lapseCount >= 5)
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch (error) {
    console.error("Failed to save quiz result to localStorage:", error);
  }
}

/**
 * Get last quiz result from localStorage
 * @returns Stored quiz result or null if expired/not found
 */
export function getLastQuizResult(): StoredQuizResult | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const result: StoredQuizResult = JSON.parse(stored);

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(result.expiresAt);

    if (now > expiresAt) {
      // Expired - clear storage
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return result;
  } catch (error) {
    console.error("Failed to retrieve quiz result from localStorage:", error);
    return null;
  }
}

/**
 * Clear quiz result from localStorage
 * Used when starting a new quiz session
 */
export function clearQuizResult(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear quiz result from localStorage:", error);
  }
}

/**
 * Check if there are stored incorrect words for review
 * @returns True if there are incorrect words available
 */
export function hasIncorrectWordsForReview(): boolean {
  const result = getLastQuizResult();
  return result !== null && result.incorrectWords.length > 0;
}
