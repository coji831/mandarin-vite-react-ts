/**
 * Quiz state reducer
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added ERROR phase and error handling
 *
 * Manages quiz flow state machine:
 * LOADING → QUESTION → ANSWER_FEEDBACK → COMPLETE | ERROR
 */

import { QuizQuestion, QuizAnswer } from "../types/QuizTypes";

export type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "COMPLETE" | "ERROR";

export interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string; // Story 15.8: Error message for fetch failures
}

export type QuizAction =
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "UPDATE_ANSWER_METADATA"; wordId: string; nextReview: string; lapseCount: number } // Story 15.8: Merge backend response
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
