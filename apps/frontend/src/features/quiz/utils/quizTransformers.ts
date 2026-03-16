/**
 * @file apps/frontend/src/features/quiz/utils/quizTransformers.ts
 * @description Data transformation utilities for quiz feature
 *
 * Story 15.11 Part B Phase 2: Extracted transformation logic from QuizContext
 * Provides pure functions to transform backend API responses to frontend domain models.
 *
 * Functions:
 * - transformSessionToQuestions: Maps backend QuizSessionQuestion to frontend QuizQuestion
 */

import type { QuizSessionQuestion, QuizQuestion } from "../types";

// ============================================================================
// Question Transformers
// ============================================================================

/**
 * Transform backend QuizSessionQuestion to frontend QuizQuestion format
 *
 * Phase 8: Backend returns sanitized questions with word data embedded.
 * Frontend needs flat structure with wordId, word, pinyin, english for display.
 *
 * Validation:
 * - Throws error if required fields missing (id, wordId, questionType, word.simplified)
 *
 * @param questions Array of QuizSessionQuestion from backend
 * @returns Array of QuizQuestion for frontend state
 * @throws Error if question structure invalid
 */
export function transformSessionToQuestions(questions: QuizSessionQuestion[]): QuizQuestion[] {
  return questions.map((q, idx) => {
    // Validate required fields
    if (!q.id || !q.wordId || !q.questionType || !q.word?.simplified) {
      throw new Error(
        `Invalid question structure at index ${idx}: missing required fields (id, wordId, questionType, word.simplified)`,
      );
    }

    return {
      id: q.id, // Use backend-assigned ID directly (format: wordId_questionType)
      wordId: q.wordId,
      mode: q.questionType,
      word: q.word.simplified,
      // Backend intentionally omits pinyin for type_pinyin and english for multiple_choice (security)
      pinyin: q.word.pinyin,
      english: q.word.english,
      options: q.options, // Present for multiple_choice questions
    };
  });
}
