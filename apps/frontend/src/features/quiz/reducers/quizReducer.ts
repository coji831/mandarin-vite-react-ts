/**
 * Quiz state reducer
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added ERROR phase and error handling
 * Story 15.9: Added gamification data capture (XP, mystery boxes, badges, freezes)
 * Story 15.11 Phase 8: Added UI state consolidation (answerValue, showHint, aiFeedback, sessionId)
 *
 * Manages quiz flow state machine:
 * LOADING → QUESTION → ANSWER_FEEDBACK → COMPLETE | ERROR
 */

import { QuizQuestion, QuizAnswer, QuizSessionSummary } from "../types";
import type { Badge, MysteryBox } from "../../gamification/types/GamificationTypes";

export type QuizPhase =
  | "LOADING"
  | "QUESTION"
  | "ANSWER_FEEDBACK"
  | "COMPLETE"
  | "DAILY_COMPLETE"
  | "NO_DUE_WORDS"
  | "ERROR";

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
  // Story 15.11 Phase 8: UI state consolidation
  sessionId: string | null; // Backend quiz session ID
  answerValue: string; // Current answer input value
  showHint: boolean; // Whether hint is visible
  aiFeedback: string | null; // AI-generated feedback for last answer
  feedbackLoading: boolean; // Loading state for AI feedback
  // Daily quiz status
  sessionSummary: QuizSessionSummary | null; // Backend-calculated session summary (for daily complete)
  expiresAt: string | null; // Midnight expiration timestamp for daily quiz reset
  // No due words message
  noDueWordsMessage?: string; // Celebration message when all caught up
}

export type QuizAction =
  | { type: "QUIZ/INITIALIZE"; questions: QuizQuestion[]; sessionId: string }
  | {
      type: "QUIZ/RESUME";
      questions: QuizQuestion[];
      sessionId: string;
      currentIndex: number;
      answers: QuizAnswer[];
    }
  | { type: "QUIZ/SUBMIT_ANSWER"; answer: QuizAnswer }
  | {
      type: "QUIZ/UPDATE_ANSWER_METADATA";
      wordId: string;
      nextReviewDate: string;
      lapseCount: number;
    } // Story 15.8: Merge backend response
  | { type: "QUIZ/ADD_XP_EARNED"; xp: number } // Story 15.9: Accumulate XP from backend
  | { type: "QUIZ/SET_MYSTERY_BOX"; mysteryBox: MysteryBox } // Story 15.9: Store mystery box reward
  | { type: "QUIZ/ADD_NEW_BADGES"; badges: Badge[] } // Story 15.9: Collect newly earned badges
  | { type: "QUIZ/SET_FREEZE_AWARDED"; awarded: boolean } // Story 15.9: Track if freeze was awarded
  | { type: "QUIZ/SET_SESSION_ID"; sessionId: string } // Story 15.11 Phase 8: Store session ID
  | { type: "QUIZ/SET_ANSWER_VALUE"; value: string } // Story 15.11 Phase 8: Update answer input
  | { type: "QUIZ/SET_SHOW_HINT"; show: boolean } // Story 15.11 Phase 8: Toggle hint visibility
  | { type: "QUIZ/SET_AI_FEEDBACK"; feedback: string | null } // Story 15.11 Phase 8: Set AI feedback
  | { type: "QUIZ/SET_FEEDBACK_LOADING"; loading: boolean } // Story 15.11 Phase 8: Set feedback loading state
  | { type: "QUIZ/CLEAR_UI_STATE" } // Story 15.11 Phase 8: Clear UI state between questions
  | {
      type: "QUIZ/SHOW_DAILY_COMPLETE_RESULTS";
      sessionId: string;
      summary: QuizSessionSummary;
      expiresAt: string;
    } // Daily quiz already completed
  | { type: "QUIZ/SHOW_NO_DUE_WORDS"; message: string } // Flow 1.2: No due words (all caught up)
  | { type: "QUIZ/NEXT_QUESTION" }
  | { type: "QUIZ/COMPLETE" }
  | { type: "QUIZ/SET_ERROR"; error: string } // Story 15.8: Set error state
  | { type: "QUIZ/RESET" }; // Story 15.8: Reset to LOADING state

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
  // Story 15.11 Phase 8: UI state defaults
  sessionId: null,
  answerValue: "",
  showHint: false,
  aiFeedback: null,
  feedbackLoading: false,
  // Daily quiz status
  sessionSummary: null,
  expiresAt: null,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "QUIZ/INITIALIZE":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        sessionId: action.sessionId,
        currentIndex: 0,
        answers: [],
        error: undefined, // Clear any previous errors
        // Reset gamification data for new quiz
        totalXP: 0,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
        // Reset UI state
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
      };

    case "QUIZ/RESUME":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        sessionId: action.sessionId,
        currentIndex: action.currentIndex, // Resume from last position
        answers: action.answers, // Restore previous answers
        error: undefined, // Clear any previous errors
        // Reset gamification data (not awarded until completion)
        totalXP: 0,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
        // Reset UI state
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
      };

    case "QUIZ/SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
      };

    case "QUIZ/UPDATE_ANSWER_METADATA": {
      // Merge backend response (nextReviewDate, lapseCount) into last answer
      const updatedAnswers = state.answers.map((answer, index) =>
        index === state.answers.length - 1 && answer.wordId === action.wordId
          ? {
              ...answer,
              nextReviewDate: action.nextReviewDate,
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
    case "QUIZ/ADD_XP_EARNED":
      return {
        ...state,
        totalXP: state.totalXP + action.xp,
      };

    // Story 15.9: Store mystery box reward (only one per quiz)
    case "QUIZ/SET_MYSTERY_BOX":
      return {
        ...state,
        mysteryBox: action.mysteryBox,
      };

    // Story 15.9: Collect newly earned badges
    case "QUIZ/ADD_NEW_BADGES":
      return {
        ...state,
        newBadges: [...state.newBadges, ...action.badges],
      };

    // Story 15.9: Track if freeze was awarded
    case "QUIZ/SET_FREEZE_AWARDED":
      return {
        ...state,
        freezeAwarded: action.awarded,
      };

    // Story 15.11 Phase 8: UI state management actions
    case "QUIZ/SET_SESSION_ID":
      return {
        ...state,
        sessionId: action.sessionId,
      };

    case "QUIZ/SET_ANSWER_VALUE":
      return {
        ...state,
        answerValue: action.value,
      };

    case "QUIZ/SET_SHOW_HINT":
      return {
        ...state,
        showHint: action.show,
      };

    case "QUIZ/SET_AI_FEEDBACK":
      return {
        ...state,
        aiFeedback: action.feedback,
      };

    case "QUIZ/SET_FEEDBACK_LOADING":
      return {
        ...state,
        feedbackLoading: action.loading,
      };

    case "QUIZ/CLEAR_UI_STATE":
      return {
        ...state,
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
      };

    case "QUIZ/SHOW_DAILY_COMPLETE_RESULTS":
      return {
        ...state,
        phase: "DAILY_COMPLETE",
        sessionId: action.sessionId,
        sessionSummary: action.summary,
        expiresAt: action.expiresAt,
        currentIndex: action.summary.totalQuestions,
        // Clear questions since we're showing previous results
        questions: [],
        answers: [],
      };

    case "QUIZ/SHOW_NO_DUE_WORDS":
      return {
        ...state,
        phase: "NO_DUE_WORDS",
        noDueWordsMessage: action.message,
        questions: [],
        answers: [],
        error: undefined,
      };

    case "QUIZ/NEXT_QUESTION": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "COMPLETE", currentIndex: nextIndex };
      }
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
        // Clear UI state for next question
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
      };
    }

    case "QUIZ/COMPLETE":
      return { ...state, phase: "COMPLETE" };

    case "QUIZ/SET_ERROR":
      return {
        ...state,
        phase: "ERROR",
        error: action.error,
      };

    case "QUIZ/RESET":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
