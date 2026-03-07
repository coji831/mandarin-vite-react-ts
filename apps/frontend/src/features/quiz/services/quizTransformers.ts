/**
 * @file apps/frontend/src/features/quiz/services/quizTransformers.ts
 * @description Data transformation utilities for quiz feature
 *
 * Story 15.11 Part B Phase 2: Extracted transformation logic from QuizContext
 * Provides pure functions to transform backend API responses to frontend domain models.
 *
 * Functions:
 * - transformSessionToQuestions: Maps backend QuizSessionQuestion to frontend QuizQuestion
 * - transformApiBadgesToDomain: Maps API badge format to domain Badge with descriptions
 */

import type { QuizSessionQuestion, Badge as ApiBadge, QuizQuestion } from "../types";
import type { Badge } from "../../gamification/types/GamificationTypes";

// ============================================================================
// Question Transformers
// ============================================================================

/**
 * Transform backend QuizSessionQuestion to frontend QuizQuestion format
 *
 * Phase 8: Backend returns sanitized questions with word data embedded.
 * Frontend needs flat structure with wordId, word, pinyin, english for display.
 *
 * @param questions Array of QuizSessionQuestion from backend
 * @returns Array of QuizQuestion for frontend state
 */
export function transformSessionToQuestions(questions: QuizSessionQuestion[]): QuizQuestion[] {
  return questions.map((q) => ({
    id: `${q.wordId}-${q.questionType}`, // Phase 8: Unique identifier for session questions
    wordId: q.wordId,
    mode: q.questionType,
    word: q.word.simplified,
    // Backend intentionally omits pinyin for type_pinyin and english for multiple_choice (security)
    pinyin: q.word.pinyin,
    english: q.word.english,
  }));
}

// ============================================================================
// Gamification Transformers
// ============================================================================

/**
 * Transform API badge format to domain Badge format
 *
 * API badges contain streakRequired but no description or earnedDate.
 * Domain badges need full metadata for display in UI components.
 *
 * @param apiBadges Array of Badge from API response (minimal metadata)
 * @returns Array of Badge for domain layer (full metadata)
 */
export function transformApiBadgesToDomain(apiBadges: ApiBadge[]): Badge[] {
  return apiBadges.map((apiBadge) => ({
    id: apiBadge.id,
    name: apiBadge.name,
    description: `Maintain a ${apiBadge.streakRequired}-day streak`,
    icon: apiBadge.icon,
    streakRequired: apiBadge.streakRequired,
    earnedDate: new Date(),
  }));
}
