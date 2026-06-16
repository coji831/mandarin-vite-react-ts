/**
 * @file apps/frontend/src/features/quiz/stores/quizSessionStore.ts
 * @description Zustand store for quiz session state (Story 17.4)
 *
 * Migrated from quizReducer to Zustand. Mirrors the exact state shape
 * and actions of the reducer. Backward-compatible with QuizContext wrapper.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { QuizQuestion, QuizAnswer } from "../types";

export type QuizPhase = "LOADING" | "QUESTION" | "ANSWER_FEEDBACK" | "RESULTS" | "ERROR";

export interface QuizSessionState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string;
  sessionId?: string;
  answerValue: string;
  showHint: boolean;
  aiFeedback?: string;
  expiresAt?: string;
  isFreshCompletion: boolean;

  // Actions
  initializeSession: (questions: QuizQuestion[], sessionId: string, expiresAt: string) => void;
  resumeSession: (
    questions: QuizQuestion[],
    sessionId: string,
    currentIndex: number,
    answers: QuizAnswer[],
    expiresAt: string,
  ) => void;
  submitAnswer: (answer: QuizAnswer) => void;
  setAnswerValue: (value: string) => void;
  toggleHint: (show: boolean) => void;
  setAiFeedback: (feedback: string | undefined) => void;
  showDailyCompleteResults: (sessionId: string, expiresAt: string) => void;
  nextQuestion: () => void;
  completeSession: () => void;
  setError: (error: string) => void;
  resetSession: () => void;
}

const initialStoreState = {
  phase: "LOADING" as QuizPhase,
  questions: [] as QuizQuestion[],
  currentIndex: 0,
  answers: [] as QuizAnswer[],
  error: undefined as string | undefined,
  sessionId: undefined as string | undefined,
  answerValue: "",
  showHint: false,
  aiFeedback: undefined as string | undefined,
  expiresAt: undefined as string | undefined,
  isFreshCompletion: false,
};

export const useQuizSessionStore = create<QuizSessionState>()(
  devtools(
    (set) => ({
      ...initialStoreState,

      initializeSession: (questions, sessionId, expiresAt) =>
        set({
          phase: "QUESTION",
          questions,
          sessionId,
          expiresAt,
          currentIndex: 0,
          answers: [],
          error: undefined,
          answerValue: "",
          showHint: false,
          aiFeedback: undefined,
        }),

      resumeSession: (questions, sessionId, currentIndex, answers, expiresAt) =>
        set({
          phase: "QUESTION",
          questions,
          sessionId,
          expiresAt,
          currentIndex,
          answers,
          error: undefined,
          answerValue: "",
          showHint: false,
          aiFeedback: undefined,
        }),

      submitAnswer: (answer) =>
        set((state) => ({
          phase: "ANSWER_FEEDBACK",
          answers: [...state.answers, answer],
        })),

      setAnswerValue: (value) =>
        set({
          answerValue: value,
        }),

      toggleHint: (show) =>
        set({
          showHint: show,
        }),

      setAiFeedback: (feedback) =>
        set({
          aiFeedback: feedback,
        }),

      showDailyCompleteResults: (sessionId, expiresAt) =>
        set({
          phase: "RESULTS",
          sessionId,
          expiresAt,
          currentIndex: 0,
          questions: [],
          answers: [],
          isFreshCompletion: false,
        }),

      nextQuestion: () =>
        set((state) => {
          const nextIndex = state.currentIndex + 1;
          if (nextIndex >= state.questions.length) {
            return {
              phase: "LOADING" as QuizPhase,
              currentIndex: nextIndex,
            };
          }
          return {
            phase: "QUESTION" as QuizPhase,
            currentIndex: nextIndex,
            answerValue: "",
            showHint: false,
            aiFeedback: undefined,
          };
        }),

      completeSession: () =>
        set({
          phase: "RESULTS",
          isFreshCompletion: true,
        }),

      setError: (error) =>
        set({
          phase: "ERROR",
          error,
        }),

      resetSession: () =>
        set({
          ...initialStoreState,
          isFreshCompletion: false,
        }),
    }),
    { name: "quiz-session" },
  ),
);
