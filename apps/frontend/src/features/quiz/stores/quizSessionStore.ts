/**
 * quizSessionStore.ts
 * Phase 1 Gate Quiz — Zustand store
 *
 * Manages the Phase 1 Gate Quiz session state.
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 *
 * Story 18.6: Integrated backend API for quiz attempt persistence.
 */

import { create } from "zustand";
import type { StrategyType, QuizPhase, QuizSession, GateQuizResult } from "../types";
import { createInitialSession } from "../types/session";
import { quizService } from "../services/quizService";
import { getStrategy } from "../engine/strategies";

type QuizSessionStore = QuizSession & {
  /** Initialize a new session with the given strategy */
  initialize: (strategyType: StrategyType) => Promise<void>;

  /** Submit an answer (pinyin + tone) for the current question */
  submitAnswer: (pinyin: string, tone: number) => Promise<void>;

  /** Advance to the next question */
  nextQuestion: () => void;

  /** Complete the quiz attempt via backend and store the result */
  completeAttempt: () => Promise<GateQuizResult | null>;

  /** Reset the session */
  reset: () => void;

  /** Reset + re-initialize (for retry/restart) */
  retry: () => Promise<void>;

  /** Decrement timer by 1 second */
  tick: () => void;
};

export const useQuizSessionStore = create<QuizSessionStore>((set, get) => ({
  ...createInitialSession("audio-to-pinyin-tone"),

  initialize: async (strategyType) => {
    set({ phase: "LOADING", error: null });
    try {
      const strategy = getStrategy(strategyType);

      // Fetch config from backend (source of truth for numeric values)
      let strategyConfig: import("../types").QuizStrategyConfig | null = null;
      try {
        strategyConfig = await quizService.getQuizConfig(strategyType);
      } catch (_apiErr) {
        // Backend unavailable — use sensible defaults
      }

      const questionCount = strategyConfig?.questionCount ?? 10;
      const timeLimitMinutes = strategyConfig?.timeLimitMinutes ?? 2.5;
      const questions = await quizService.generateQuestionPool(strategyType, questionCount);
      const timer = Math.round(timeLimitMinutes * 60);

      // Create a backend attempt record (non-blocking — store attemptId for later use)
      let attemptId: string | null = null;
      try {
        const attempt = await quizService.createQuizAttempt(strategyType, strategy?.phase ?? 1);
        attemptId = attempt.id;
      } catch (_apiErr) {
        // Backend unavailable — proceed without remote attempt, answers won't be persisted
      }

      set({
        strategyType,
        questions,
        currentIndex: 0,
        answers: [],
        score: 0,
        timer,
        phase: questions.length > 0 ? "INPUT" : "RESULTS",
        error: null,
        attemptId,
        strategyConfig,
      });
    } catch (err) {
      set({
        phase: "ERROR",
        error: err instanceof Error ? err.message : "Failed to load questions",
      });
    }
  },

  submitAnswer: async (pinyin: string, tone: number) => {
    const { questions, currentIndex, strategyType, attemptId } = get();
    const question = questions[currentIndex];
    if (!question) return;

    const strategy = getStrategy(strategyType);
    if (!strategy) return;

    // Step 1: Local evaluation (optimistic UI — shown immediately)
    const optimisticResult = strategy.evaluateAnswer(question, pinyin, tone);

    // Step 2: Send to backend for authoritative evaluation
    let backendVerdict = optimisticResult;
    if (attemptId) {
      try {
        const backendAnswer = await quizService.submitAnswer(attemptId, {
          questionIndex: currentIndex,
          pinyinInput: pinyin,
          selectedTone: tone,
          correctPinyin: question.correctPinyin,
          correctTone: question.correctTone,
          category: question.category,
        });
        // Use backend's verdict as authoritative
        // For IME and multiple-choice, trust local evaluation
        // (backend compares pinyin strings; MC strategies use option IDs)
        const trustLocalEval = strategyType === "ime-simulator" || strategyType === "radical-gate";
        if (!trustLocalEval && backendAnswer.correct !== optimisticResult.correct) {
          backendVerdict = {
            ...optimisticResult,
            correct: backendAnswer.correct,
          };
        }
      } catch (apiErr) {
        // Backend unavailable — keep optimistic UI result
        set({ error: apiErr instanceof Error ? apiErr.message : "Answer submission failed" });
      }
    }

    const isLastQuestion = currentIndex + 1 >= questions.length;

    if (isLastQuestion) {
      // Skip FEEDBACK for last question — go directly to RESULTS
      get().completeAttempt();
      set((s) => ({
        answers: [...s.answers, backendVerdict],
        score: s.score + (backendVerdict.correct ? 1 : 0),
        phase: "RESULTS" as QuizPhase,
      }));
    } else {
      set((s) => ({
        answers: [...s.answers, backendVerdict],
        score: s.score + (backendVerdict.correct ? 1 : 0),
        phase: "FEEDBACK" as QuizPhase,
      }));
    }
  },

  completeAttempt: async () => {
    const { attemptId } = get();
    if (!attemptId) return null;
    try {
      const result = await quizService.completeQuizAttempt(attemptId);
      set({ completionResult: result });
      return result;
    } catch (apiErr) {
      // Backend unavailable — still show results locally
      set({ error: apiErr instanceof Error ? apiErr.message : "Failed to complete quiz attempt" });
      return null;
    }
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 < questions.length) {
      set({ currentIndex: currentIndex + 1, phase: "QUESTION" });
    } else {
      // Finalize the backend attempt before showing results
      get().completeAttempt();
      set({ phase: "RESULTS" });
    }
  },

  tick: () => {
    const { timer, phase } = get();
    if (timer > 0 && phase !== "RESULTS" && phase !== "ERROR") {
      const newTimer = timer - 1;
      if (newTimer === 0) {
        // Time's up — auto-submit current answer if pending, then show results
        get().completeAttempt();
        set({ timer: 0, phase: "RESULTS" });
      } else {
        set({ timer: newTimer });
      }
    }
  },

  reset: () => {
    const { strategyType } = get();
    set(createInitialSession(strategyType));
  },

  retry: async () => {
    const { strategyType } = get();
    set(createInitialSession(strategyType));
    // Re-initialize with the same strategy — generates new questions
    const store = get();
    await store.initialize(strategyType);
  },
}));
