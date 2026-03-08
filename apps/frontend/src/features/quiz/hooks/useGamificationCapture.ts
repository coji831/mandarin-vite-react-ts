/**
 * @file apps/frontend/src/features/quiz/hooks/useGamificationCapture.ts
 * @description Hook for capturing and dispatching gamification rewards
 *
 * Story 15.11 Part B Phase 3: Extracted gamification logic from QuizContext
 * Centralizes processing of XP, badges, mystery boxes, and freeze awards from quiz results.
 *
 * Responsibilities:
 * - Process QuizAnswerResponse.gamification data
 * - Transform API badge format to domain model
 * - Dispatch gamification actions to quiz state
 *
 * Used by: useAnswerSubmission hook for processing answer results
 *
 * @see docs/issue-implementation/epic-15-learning-retention/story-15-11-spaced-repetition-refactoring.md
 */

import { useCallback } from "react";
import type { QuizAction } from "../reducers/quizReducer";
import type { QuizAnswerResponse } from "../types";
import { transformApiBadgesToDomain } from "../services/quizTransformers";

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for capturing gamification rewards from quiz answer responses
 *
 * @param dispatch Quiz reducer dispatch function
 * @returns Object with captureGamificationData method
 */
export function useGamificationCapture(dispatch: React.Dispatch<QuizAction>) {
  /**
   * Process gamification data from answer response and dispatch to state
   *
   * Handles:
   * - XP earned (base + streak bonuses)
   * - Mystery boxes (5% drop chance on streak milestones)
   * - New badges (7/30/100/365-day streaks)
   * - Freeze awards (10 consecutive perfect quizzes)
   *
   * @param result QuizAnswerResponse from backend
   */
  const captureGamificationData = useCallback(
    (result: QuizAnswerResponse) => {
      if (!result.gamification) {
        return;
      }

      // Capture XP earned (base: 10, bonus: +5 if streak ≥ 7 days)
      if (result.gamification.xpEarned) {
        dispatch({ type: "ADD_XP_EARNED", xp: result.gamification.xpEarned });
      }

      // Capture mystery box (5% chance on 7-day multiples)
      if (result.gamification.mysteryBox) {
        dispatch({ type: "SET_MYSTERY_BOX", mysteryBox: result.gamification.mysteryBox });
      }

      // Capture newly unlocked badges (streak milestones)
      if (result.gamification.newBadges && result.gamification.newBadges.length > 0) {
        const convertedBadges = transformApiBadgesToDomain(result.gamification.newBadges);
        dispatch({ type: "ADD_NEW_BADGES", badges: convertedBadges });
      }

      // Capture freeze award (10 consecutive perfect quizzes)
      if (result.gamification.freezeAwarded) {
        dispatch({ type: "SET_FREEZE_AWARDED", awarded: result.gamification.freezeAwarded });
      }
    },
    [dispatch],
  );

  return {
    captureGamificationData,
  };
}
