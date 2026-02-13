/**
 * Quiz state reducer
 * Story 15.6: Quiz Container & State Management
 *
 * Manages quiz flow state machine:
 * LOADING → QUESTION → ANSWER_FEEDBACK → COMPLETE
 */

import { QuizQuestion, QuizAnswer } from "../types/QuizTypes";

export type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "COMPLETE";

export interface QuizState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
}

export type QuizAction =
  | { type: "INITIALIZE_QUIZ"; questions: QuizQuestion[] }
  | { type: "SUBMIT_ANSWER"; answer: QuizAnswer }
  | { type: "NEXT_QUESTION" }
  | { type: "COMPLETE_QUIZ" };

export const initialState: QuizState = {
  phase: "LOADING",
  questions: [],
  currentIndex: 0,
  answers: [],
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
      };

    case "SUBMIT_ANSWER":
      return {
        ...state,
        phase: "ANSWER_FEEDBACK",
        answers: [...state.answers, action.answer],
      };

    case "NEXT_QUESTION":
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, phase: "COMPLETE", currentIndex: nextIndex };
      }
      return {
        ...state,
        phase: "QUESTION",
        currentIndex: nextIndex,
      };

    case "COMPLETE_QUIZ":
      return { ...state, phase: "COMPLETE" };

    default:
      return state;
  }
}
