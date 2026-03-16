/**
 * Quiz state reducer
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added ERROR phase and error handling
 * Story 15.9: Added gamification data capture (XP, mystery boxes, badges, freezes)
 * Story 15.11 Phase 8: Added UI state consolidation (answerValue, showHint, aiFeedback, sessionId)
 *
 * Manages quiz flow state machine:
 * LOADING → QUESTION → ANSWER_FEEDBACK → RESULTS | ERROR
 */

import { QuizQuestion, QuizAnswer } from "../types";

export type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "RESULTS" | "ERROR";

export interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string; // Story 15.8: Error message for fetch failures
  // Story 15.11 Phase 8: UI state consolidation
  sessionId?: string; // Backend quiz session ID
  answerValue: string; // Current answer input value
  showHint: boolean; // Whether hint is visible
  aiFeedback?: string; // AI-generated feedback for last answer
  // Daily quiz status
  expiresAt?: string; // Midnight expiration timestamp for daily quiz reset
  isFreshCompletion: boolean; // True only when quiz was just completed (not when resuming/viewing)
}

export type QuizAction =
  | { type: "QUIZ/INITIALIZE"; questions: QuizQuestion[]; sessionId: string; expiresAt: string }
  | {
      type: "QUIZ/RESUME";
      questions: QuizQuestion[];
      sessionId: string;
      currentIndex: number;
      answers: QuizAnswer[];
      expiresAt: string;
    }
  | { type: "QUIZ/SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "QUIZ/SET_ANSWER_VALUE"; value: string } // Story 15.11 Phase 8: Update answer input
  | { type: "QUIZ/SET_SHOW_HINT"; show: boolean } // Story 15.11 Phase 8: Toggle hint visibility
  | { type: "QUIZ/SET_AI_FEEDBACK"; feedback: string | undefined } // Story 15.11 Phase 8: Set AI feedback
  | { type: "QUIZ/SHOW_DAILY_COMPLETE_RESULTS"; sessionId: string; expiresAt: string } // Daily quiz already completed
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
  // Story 15.11 Phase 8: UI state defaults
  sessionId: undefined,
  answerValue: "",
  showHint: false,
  aiFeedback: undefined,
  // Daily quiz status
  expiresAt: undefined,
  isFreshCompletion: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "QUIZ/INITIALIZE":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        sessionId: action.sessionId,
        expiresAt: action.expiresAt,
        currentIndex: 0,
        answers: [],
        error: undefined, // Clear any previous errors
        // Reset UI state
        answerValue: "",
        showHint: false,
        aiFeedback: undefined,
      };

    case "QUIZ/RESUME":
      return {
        ...state,
        phase: "QUESTION",
        questions: action.questions,
        sessionId: action.sessionId,
        expiresAt: action.expiresAt,
        currentIndex: action.currentIndex, // Resume from last position
        answers: action.answers, // Restore previous answers
        error: undefined, // Clear any previous errors
        // Reset UI state
        answerValue: "",
        showHint: false,
        aiFeedback: undefined,
      };

    case "QUIZ/SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
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

    case "QUIZ/SHOW_DAILY_COMPLETE_RESULTS":
      return {
        ...state,
        phase: "RESULTS",
        sessionId: action.sessionId,
        expiresAt: action.expiresAt,
        currentIndex: 0,
        // Clear questions since we're showing previous results
        questions: [],
        answers: [],
        isFreshCompletion: false,
      };

    case "QUIZ/NEXT_QUESTION": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "LOADING", currentIndex: nextIndex };
      }
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
        // Clear UI state for next question
        answerValue: "",
        showHint: false,
        aiFeedback: undefined,
      };
    }

    case "QUIZ/COMPLETE":
      return { ...state, phase: "RESULTS", isFreshCompletion: true };

    case "QUIZ/SET_ERROR":
      return {
        ...state,
        phase: "ERROR",
        error: action.error,
      };

    case "QUIZ/RESET":
      return {
        ...initialState,
        isFreshCompletion: false,
      };

    default:
      return state;
  }
}
