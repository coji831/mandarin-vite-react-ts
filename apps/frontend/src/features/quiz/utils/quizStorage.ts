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

import type { QuizAnswer } from "../types/QuizTypes";

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
 * @param answers - Array of quiz answers from completed session
 */
export function saveQuizResult(answers: QuizAnswer[]): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  const incorrectAnswers = answers.filter((a) => !a.correct);
  const correctCount = answers.filter((a) => a.correct).length;
  const totalWords = answers.length;
  const accuracyRate = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  // Extract incorrect words with full details
  const incorrectWords: StoredIncorrectWord[] = incorrectAnswers
    .map((answer) => ({
      wordId: answer.wordId,
      word: answer.word || "",
      pinyin: answer.pinyin || "",
      english: answer.english || "",
      userAnswer: answer.userAnswer,
      questionType: answer.questionType,
    }))
    .filter((w) => w.word); // Only include words with chinese character

  // Identify leeches (lapseCount >= 5)
  const leechWords = answers.filter((a) => (a.lapseCount || 0) >= 5).map((a) => a.wordId);

  const result: StoredQuizResult = {
    sessionId: `quiz-${now.getTime()}`,
    completedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    totalWords,
    correctCount,
    incorrectCount: incorrectAnswers.length,
    accuracyRate,
    incorrectWords,
    leechWords,
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
