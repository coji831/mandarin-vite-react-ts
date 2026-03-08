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

import { QuizQuestion, QuizAnswer, MysteryBox, Badge, QuizSessionSummary } from "../types";

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
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[]; sessionId: string }
  | {
      type: "RESUME_QUIZ";
      questions: QuizQuestion[];
      sessionId: string;
      currentIndex: number;
      answers: QuizAnswer[];
    }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "UPDATE_ANSWER_METADATA"; wordId: string; nextReview: string; lapseCount: number } // Story 15.8: Merge backend response
  | { type: "ADD_XP_EARNED"; xp: number } // Story 15.9: Accumulate XP from backend
  | { type: "SET_MYSTERY_BOX"; mysteryBox: MysteryBox } // Story 15.9: Store mystery box reward
  | { type: "ADD_NEW_BADGES"; badges: Badge[] } // Story 15.9: Collect newly earned badges
  | { type: "SET_FREEZE_AWARDED"; awarded: boolean } // Story 15.9: Track if freeze was awarded
  | { type: "SET_SESSION_ID"; sessionId: string } // Story 15.11 Phase 8: Store session ID
  | { type: "SET_ANSWER_VALUE"; value: string } // Story 15.11 Phase 8: Update answer input
  | { type: "SET_SHOW_HINT"; show: boolean } // Story 15.11 Phase 8: Toggle hint visibility
  | { type: "SET_AI_FEEDBACK"; feedback: string | null } // Story 15.11 Phase 8: Set AI feedback
  | { type: "SET_FEEDBACK_LOADING"; loading: boolean } // Story 15.11 Phase 8: Set feedback loading state
  | { type: "CLEAR_UI_STATE" } // Story 15.11 Phase 8: Clear UI state between questions
  | {
      type: "SHOW_DAILY_COMPLETE_RESULTS";
      sessionId: string;
      summary: QuizSessionSummary;
      expiresAt: string;
    } // Daily quiz already completed
  | { type: "SHOW_NO_DUE_WORDS"; message: string } // Flow 1.2: No due words (all caught up)
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
    case "INITIALIZE_QUIZ":
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

    case "RESUME_QUIZ":
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
        freezeAwarded: action.awarded,
      };

    // Story 15.11 Phase 8: UI state management actions
    case "SET_SESSION_ID":
      return {
        ...state,
        sessionId: action.sessionId,
      };

    case "SET_ANSWER_VALUE":
      return {
        ...state,
        answerValue: action.value,
      };

    case "SET_SHOW_HINT":
      return {
        ...state,
        showHint: action.show,
      };

    case "SET_AI_FEEDBACK":
      return {
        ...state,
        aiFeedback: action.feedback,
      };

    case "SET_FEEDBACK_LOADING":
      return {
        ...state,
        feedbackLoading: action.loading,
      };

    case "CLEAR_UI_STATE":
      return {
        ...state,
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
      };

    case "SHOW_DAILY_COMPLETE_RESULTS":
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

    case "SHOW_NO_DUE_WORDS":
      return {
        ...state,
        phase: "NO_DUE_WORDS",
        noDueWordsMessage: action.message,
        questions: [],
        answers: [],
        error: undefined,
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
        // Clear UI state for next question
        answerValue: "",
        showHint: false,
        aiFeedback: null,
        feedbackLoading: false,
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
