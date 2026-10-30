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
import type {
  StrategyType,
  QuizPhase,
  QuizSession,
  GateQuizResult,
  QuizStrategyConfig,
  AnswerResult,
  QuizQuestion,
} from "../types";
import { createInitialSession } from "../types/session";
import { quizService } from "../services/quizService";
import { getStrategy } from "../engine/strategies";
import { AUTHORED_ANNOUNCEMENT_STRATEGIES } from "../engine/constants";
import { getPhoneticHint, getCharacterDetail } from "../services/hintService";

/**
 * The completion summary, composed ONCE at the RESULTS transition (§26.2.4) from
 * local state. It is deliberately not derived in `QuizResults`: the backend
 * result lands later and would announce the same fact a second time.
 */
function completionAnnouncement(correct: number, total: number): string {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  // Facts only. The verdict is left to the on-screen badge, which is driven by
  // the server result: `tierRules` can raise a format's threshold (radical-gate
  // requires 100%), so announcing a local "Passed." here could contradict the
  // badge a moment later.
  return `Quiz complete. ${correct} of ${total}, ${pct} percent.`;
}

/** The per-question verdict, announced before the FEEDBACK surface takes focus. */
function verdictAnnouncement(correct: boolean, answer: string, correctTone: number): string {
  return correct
    ? `Correct. Tone ${correctTone}.`
    : `Incorrect. The answer is ${answer}, tone ${correctTone}.`;
}

/**
 * The announcement for a submitted answer (§26.3).
 *
 * The tone/option formats read a verdict from a tone number. An Epic 26 practice
 * answer is a token, an ordered sentence or a typed transcription, so those
 * strategies author the whole sentence in `AnswerResult.feedback` — the store
 * announces it unsplit rather than inventing "Tone 0." for an answer that has no
 * tone.
 */
function submittedAnnouncement(
  strategyType: StrategyType,
  verdict: AnswerResult,
  question: QuizQuestion,
): string {
  if (AUTHORED_ANNOUNCEMENT_STRATEGIES.has(strategyType)) return verdict.feedback;
  return verdictAnnouncement(
    verdict.correct,
    question.displayPinyin || question.correctPinyin,
    verdict.correctTone,
  );
}

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

  /**
   * Set the session announcement directly. The practice-format surfaces own
   * steps the store cannot see ("Added 我, position 1 of 4."), and the session
   * still has exactly ONE region for them.
   */
  announce: (text: string) => void;

  // ─── Hint system actions (Story 21.18) ────────────────────────────

  /** Consume one hint (decrement hintsRemaining) */
  useHint: () => void;

  /** Reset hints for a new quiz session */
  resetHints: () => void;

  /** Apply -5% penalty for using a radical hint on the current question */
  applyRadicalPenalty: () => void;

  /** Record an answer by classification type for score-by-type tracking */
  recordAnswerByType: (classification: string, correct: boolean) => void;
};

export const useQuizSessionStore = create<QuizSessionStore>((set, get) => ({
  ...createInitialSession("audio-to-pinyin-tone"),

  initialize: async (strategyType) => {
    set({ phase: "LOADING", error: null });
    try {
      const strategy = getStrategy(strategyType);

      // Fetch config from backend (source of truth for numeric values)
      let strategyConfig: QuizStrategyConfig | null = null;
      try {
        strategyConfig = await quizService.getQuizConfig(strategyType);
      } catch (_apiErr) {
        // Backend unavailable — use sensible defaults
      }

      const questionCount = strategyConfig?.questionCount ?? 10;
      const timeLimitMinutes = strategyConfig?.timeLimitMinutes ?? 2.5;
      const questions = await quizService.generateQuestionPool(strategyType, questionCount);
      const timer = Math.round(timeLimitMinutes * 60);

      // Compute session metadata for backend tracking
      const neutralToneTested = questions.some((q) => q.correctTone === 0);
      const sandhiQuestions = questions.filter((q) => q.isSandhiQuestion).length;
      const metadata = { neutralToneTested, sandhiQuestions };

      // Create a backend attempt record (non-blocking — store attemptId for later use)
      let attemptId: string | null = null;
      try {
        const attempt = await quizService.createQuizAttempt(
          strategyType,
          strategy?.phase ?? 1,
          metadata,
        );
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
        hintsRemaining: 3,
        currentPhoneticHint: null,
        showRadicalHint: false,
        maxScorePenalty: 0,
        scoreByType: {},
        announcement:
          questions.length > 0
            ? `Session started. Question 1 of ${questions.length}.`
            : "No questions available.",
      });
    } catch (err) {
      set({
        phase: "ERROR",
        error: err instanceof Error ? err.message : "Failed to load questions",
      });
    }
  },

  submitAnswer: async (pinyin: string, tone: number) => {
    const { questions, currentIndex, strategyType, attemptId, score } = get();
    const question = questions[currentIndex];
    if (!question) return;

    const strategy = getStrategy(strategyType);
    if (!strategy) return;

    // Step 1: Local evaluation (optimistic UI — shown immediately)
    const optimisticResult = strategy.evaluateAnswer(question, pinyin, tone);

    // Step 2: For IME Simulator, fetch phonetic hint and character detail on wrong answer
    let augmentedResult = optimisticResult;
    if (strategyType === "ime-simulator" && !optimisticResult.correct && question.character) {
      // Fetch phonetic hint and character detail in parallel
      const [phoneticHintData, charDetail] = await Promise.all([
        getPhoneticHint(question.character),
        getCharacterDetail(question.character),
      ]);

      augmentedResult = {
        ...optimisticResult,
        phoneticHint: phoneticHintData,
        classification: charDetail?.classification ?? undefined,
      };

      // Update current phonetic hint state in store
      if (phoneticHintData) {
        set({
          currentPhoneticHint: {
            data: phoneticHintData,
            hasPhoneticComponent: true,
          },
        });
      } else {
        set({
          currentPhoneticHint: {
            data: null,
            hasPhoneticComponent: false,
          },
        });
      }
    } else if (strategyType === "ime-simulator" && question.character) {
      // Correct answer — still fetch classification for score-by-type tracking
      const charDetail = await getCharacterDetail(question.character);
      if (charDetail?.classification) {
        augmentedResult = {
          ...optimisticResult,
          classification: charDetail.classification,
        };
      }
    }

    // Step 3: Record answer by classification type
    if (augmentedResult.classification) {
      get().recordAnswerByType(augmentedResult.classification, augmentedResult.correct);
    }

    // Step 4: Send to backend for authoritative evaluation
    let backendVerdict = augmentedResult;
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
        if (!trustLocalEval && backendAnswer.correct !== augmentedResult.correct) {
          backendVerdict = {
            ...augmentedResult,
            correct: backendAnswer.correct,
          };
        }
      } catch (apiErr) {
        // Backend unavailable — keep optimistic UI result
        set({ error: apiErr instanceof Error ? apiErr.message : "Answer submission failed" });
      }
    }

    const isLastQuestion = currentIndex + 1 >= questions.length;
    const nextScore = score + (backendVerdict.correct ? 1 : 0);

    if (isLastQuestion) {
      // Skip FEEDBACK for last question — go directly to RESULTS, so the
      // completion summary is the ONE announcement for this transition.
      get().completeAttempt();
      set((s) => ({
        answers: [...s.answers, backendVerdict],
        score: nextScore,
        phase: "RESULTS" as QuizPhase,
        announcement: completionAnnouncement(nextScore, questions.length),
      }));
    } else {
      set((s) => ({
        answers: [...s.answers, backendVerdict],
        score: nextScore,
        phase: "FEEDBACK" as QuizPhase,
        announcement: submittedAnnouncement(strategyType, backendVerdict, question),
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
    const { currentIndex, questions, score } = get();
    // Clear per-question hint state
    set({ currentPhoneticHint: null, showRadicalHint: false });
    if (currentIndex + 1 < questions.length) {
      set({
        currentIndex: currentIndex + 1,
        phase: "QUESTION",
        announcement: `Question ${currentIndex + 2} of ${questions.length}.`,
      });
    } else {
      // Finalize the backend attempt before showing results
      get().completeAttempt();
      set({
        phase: "RESULTS",
        announcement: completionAnnouncement(score, questions.length),
      });
    }
  },

  tick: () => {
    const { timer, phase } = get();
    if (timer > 0 && phase !== "RESULTS" && phase !== "ERROR") {
      const newTimer = timer - 1;
      if (newTimer === 0) {
        // Time's up — auto-submit current answer if pending, then show results
        get().completeAttempt();
        set({
          timer: 0,
          phase: "RESULTS",
          announcement: "Time is up. Showing your results.",
        });
      } else {
        // Thresholds, not a per-second counter: the live region must not carry
        // the ticking value (the visible Timer states it instead).
        const announcement =
          timer > 10 && newTimer <= 10
            ? "10 seconds left"
            : timer > 30 && newTimer <= 30
              ? "30 seconds left"
              : null;
        set({ timer: newTimer, ...(announcement ? { announcement } : {}) });
      }
    }
  },

  reset: () => {
    const { strategyType } = get();
    set(createInitialSession(strategyType));
  },

  announce: (text: string) => {
    set({ announcement: text });
  },

  retry: async () => {
    const { strategyType } = get();
    set(createInitialSession(strategyType));
    // Re-initialize with the same strategy — generates new questions
    const store = get();
    await store.initialize(strategyType);
  },

  // ─── Hint system actions (Story 21.18) ────────────────────────────

  useHint: () => {
    set((s) => ({
      hintsRemaining: Math.max(0, s.hintsRemaining - 1),
    }));
  },

  resetHints: () => {
    set({
      hintsRemaining: 3,
      currentPhoneticHint: null,
      showRadicalHint: false,
      maxScorePenalty: 0,
      scoreByType: {},
    });
  },

  applyRadicalPenalty: () => {
    set((s) => ({
      maxScorePenalty: s.maxScorePenalty + 0.05,
      showRadicalHint: true,
    }));
  },

  recordAnswerByType: (classification: string, correct: boolean) => {
    set((s) => {
      const current = s.scoreByType[classification] ?? { correct: 0, total: 0 };
      return {
        scoreByType: {
          ...s.scoreByType,
          [classification]: {
            correct: current.correct + (correct ? 1 : 0),
            total: current.total + 1,
          },
        },
      };
    });
  },
}));
