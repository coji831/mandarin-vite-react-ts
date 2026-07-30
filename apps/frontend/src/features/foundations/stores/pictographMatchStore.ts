/**
 * @file stores/pictographMatchStore.ts
 * @description Local Zustand store for Pictograph Match mini-game state
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 *
 * Standalone store — does NOT extend quizStore or use backend persistence.
 * Results are stored locally only for MVP.
 */

import { create } from "zustand";
import { generateMatchQuestions } from "../services/pictographGalleryService";
import type { MatchQuestion } from "../services/pictographGalleryService";

export interface PictographMatchState {
  questions: MatchQuestion[];
  currentQuestion: number;
  score: number;
  isComplete: boolean;
  selectedAnswer: string | null;
  showResult: boolean;

  /** Start a new round by generating fresh questions */
  startRound: () => void;
  /** Submit an answer for the current question */
  answerQuestion: (answer: string) => void;
  /** Advance to the next question (after result display) */
  nextQuestion: () => void;
  /** Reset the entire game state */
  reset: () => void;
}

export const usePictographMatchStore = create<PictographMatchState>((set, get) => ({
  questions: [],
  currentQuestion: 0,
  score: 0,
  isComplete: false,
  selectedAnswer: null,
  showResult: false,

  startRound: () => {
    const questions = generateMatchQuestions(10);
    set({
      questions,
      currentQuestion: 0,
      score: 0,
      isComplete: false,
      selectedAnswer: null,
      showResult: false,
    });
  },

  answerQuestion: (answer: string) => {
    const { questions, currentQuestion, score } = get();
    if (currentQuestion >= questions.length) return;

    const isCorrect = answer === questions[currentQuestion].correctAnswer;
    set({
      selectedAnswer: answer,
      score: isCorrect ? score + 1 : score,
      showResult: true,
    });
  },

  nextQuestion: () => {
    const { currentQuestion, questions } = get();
    const nextIndex = currentQuestion + 1;

    if (nextIndex >= questions.length) {
      set({ isComplete: true, showResult: false, selectedAnswer: null });
    } else {
      set({ currentQuestion: nextIndex, showResult: false, selectedAnswer: null });
    }
  },

  reset: () => {
    set({
      questions: [],
      currentQuestion: 0,
      score: 0,
      isComplete: false,
      selectedAnswer: null,
      showResult: false,
    });
  },
}));
