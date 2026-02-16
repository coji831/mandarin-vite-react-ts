/**
 * Quiz state reducer
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added ERROR phase and error handling
 * Story 15.9: Added gamification data capture (XP, mystery boxes, badges, freezes)
 *
 * Manages quiz flow state machine:
 * LOADING → QUESTION → ANSWER_FEEDBACK → COMPLETE | ERROR
 */

import { QuizQuestion, QuizAnswer } from "../types/QuizTypes";
import type { MysteryBox } from "../hooks/useQuizAPI";
import type { Badge } from "../../gamification/types/GamificationTypes";

export type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "COMPLETE" | "ERROR";

export interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string; // Story 15.8: Error message for fetch failures
  // Story 15.9: Gamification data captured during quiz
  totalXP: number; // Accumulated XP from all correct answers
  mysteryBox?: MysteryBox; // Random reward (only one per quiz session)
  newBadges: Badge[]; // Newly earned badges during this quiz
  freezeAwarded: boolean; // True if a freeze was awarded during quiz
}

export type QuizAction =
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "UPDATE_ANSWER_METADATA"; wordId: string; nextReview: string; lapseCount: number } // Story 15.8: Merge backend response
  | { type: "ADD_XP_EARNED"; xp: number } // Story 15.9: Accumulate XP from backend
  | { type: "SET_MYSTERY_BOX"; mysteryBox: MysteryBox } // Story 15.9: Store mystery box reward
  | { type: "ADD_NEW_BADGES"; badges: Badge[] } // Story 15.9: Collect newly earned badges
  | { type: "SET_FREEZE_AWARDED"; awarded: boolean } // Story 15.9: Track if freeze was awarded
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ" }
  | { type: "SET_ERROR"; error: string } // Story 15.8: Set error state
  | { type: "RESET_QUIZ" }; // Story 15.8: Reset to LOADING state

export const initialState: QuizState = {
  phase: "LOADING",
  questions: [],
  currentIndex: 0,
  answers: [],
  error: undefined,
  totalXP: 0,
  mysteryBox: undefined,
  newBadges: [],
  freezeAwarded: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "INITIALIZE_QUIZ":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        currentIndex: 0,
        answers: [],
        error: undefined, // Clear any previous errors
        // Reset gamification data for new quiz
        totalXP: 0,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      };

    case "SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
      };

    case "UPDATE_ANSWER_METADATA": {
      // Merge backend response (nextReview, lapseCount) into last answer
      const updatedAnswers = state.answers.map((answer, index) =>
        index === state.answers.length - 1 && answer.wordId === action.wordId
          ? {
              ...answer,
              nextReview: action.nextReview,
              lapseCount: action.lapseCount,
            }
          : answer,
      );
      return {
        ...state,
        answers: updatedAnswers,
      };
    }

    // Story 15.9: Accumulate XP from backend responses
    case "ADD_XP_EARNED":
      return {
        ...state,
        totalXP: state.totalXP + action.xp,
      };

    // Story 15.9: Store mystery box reward (only one per quiz)
    case "SET_MYSTERY_BOX":
      return {
        ...state,
        mysteryBox: action.mysteryBox,
      };

    // Story 15.9: Collect newly earned badges
    case "ADD_NEW_BADGES":
      return {
        ...state,
        newBadges: [...state.newBadges, ...action.badges],
      };

    // Story 15.9: Track if freeze was awarded
    case "SET_FREEZE_AWARDED":
      return {
        ...state,
        freezeAwarded: action.awarded || state.freezeAwarded,
      };

    case "NEXT_QUESTION": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "COMPLETE", currentIndex: nextIndex };
      }
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
      };
    }

    case "COMPLETE_QUIZ":
      return { ...state, phase: "COMPLETE" };

    case "SET_ERROR":
      return {
        ...state,
        phase: "ERROR",
        error: action.error,
      };

    case "RESET_QUIZ":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
