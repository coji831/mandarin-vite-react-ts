/**
 * Quiz Context - Centralized State Management
 * Epic 19: State Refactor
 *
 * Provides centralized state management for the entire quiz flow,
 * eliminating props drilling by exposing state and actions through context.
 *
 * State includes:
 * - Quiz flow state (phase, questions, currentIndex, answers)
 * - UI state (answerValue, showHint)
 * - AI feedback state (aiFeedback, feedbackLoading)
 * - Gamification data (totalXP, mysteryBox, newBadges, freezeAwarded)
 *
 * Actions include:
 * - handleAnswer: Submit answer and trigger backend save + AI feedback
 * - handleNext: Advance to next question
 * - handleRetry: Reset quiz and reload due words
 * - setAnswerValue: Update type input value
 * - toggleHint: Show/hide hint overlay
 * - getCorrectAnswer: Get correct answer for current question
 */

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useFetchDueWords, useSaveTestResult } from "../hooks/useQuizAPI";
import { useGenerateFeedback } from "../hooks/useAIFeedback";
import { initialState, quizReducer, QuizPhase } from "../reducers/quizReducer";
import { QuizQuestion, QuizAnswer } from "../types/QuizTypes";
import { createInterleavedQuestions } from "../utils/interleaving";
import { validatePinyinAnswer } from "../utils/validation";
import type { MysteryBox } from "../hooks/useQuizAPI";
import type { Badge } from "../../gamification/types/GamificationTypes";

// ============================================================================
// Context Types
// ============================================================================

interface QuizStateContext {
  // Core quiz state
  phase: QuizPhase;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: QuizAnswer[];
  error?: string;

  // Derived state
  currentQuestion: QuizQuestion | null;

  // UI state
  answerValue: string;
  showHint: boolean;

  // AI feedback state
  aiFeedback: string | null;
  feedbackLoading: boolean;

  // Gamification data
  totalXP: number;
  mysteryBox?: MysteryBox;
  newBadges: Badge[];
  freezeAwarded: boolean;
}

interface QuizActionsContext {
  // Answer handlers
  handleAnswer: (userAnswer: string) => Promise<void>;
  handleSubmitAnswer: () => void;
  handleNext: () => void;
  handleRetry: () => void;

  // UI actions
  setAnswerValue: (value: string) => void;
  toggleHint: () => void;

  // Utility
  getCorrectAnswer: (question: QuizQuestion) => string;
  validateAnswer: (userAnswer: string, question: QuizQuestion) => boolean;
}

// ============================================================================
// Context Creation
// ============================================================================

const QuizStateCtx = createContext<QuizStateContext | undefined>(undefined);
const QuizActionsCtx = createContext<QuizActionsContext | undefined>(undefined);

// ============================================================================
// Custom Hooks
// ============================================================================

export function useQuizState(): QuizStateContext {
  const context = useContext(QuizStateCtx);
  if (!context) {
    throw new Error("useQuizState must be used within QuizProvider");
  }
  return context;
}

export function useQuizActions(): QuizActionsContext {
  const context = useContext(QuizActionsCtx);
  if (!context) {
    throw new Error("useQuizActions must be used within QuizProvider");
  }
  return context;
}

// ============================================================================
// Provider Component
// ============================================================================

interface QuizProviderProps {
  children: ReactNode;
}

export function QuizProvider({ children }: QuizProviderProps) {
  // Core state (reducer)
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // API hooks
  const { fetchDueWords } = useFetchDueWords();
  const { saveTestResult } = useSaveTestResult();
  const { generateFeedback } = useGenerateFeedback();

  // Refs
  const questionStartTime = useRef<number>(0);

  // UI state
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answerValue, setAnswerValue] = useState("");

  // ============================================================================
  // Effects
  // ============================================================================

  // Load due words on mount
  const loadDueWords = useCallback(async () => {
    try {
      const response = await fetchDueWords();

      if (response.words.length === 0) {
        dispatch({
          type: "SET_ERROR",
          error: "No words due for review today. Great job staying on track!",
        });
        return;
      }

      // Map backend DueWord format to frontend format
      const words = response.words.map((w) => ({
        id: w.id,
        chinese: w.simplified,
        pinyin: w.pinyin,
        english: w.english,
      }));

      const questions = createInterleavedQuestions(words);
      dispatch({ type: "INITIALIZE_QUIZ", questions });
      questionStartTime.current = Date.now();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load quiz";
      dispatch({ type: "SET_ERROR", error: errorMessage });
    }
  }, [fetchDueWords]);

  useEffect(() => {
    loadDueWords();
  }, [loadDueWords]);

  // Reset hint and answer input when question changes
  useEffect(() => {
    setShowHint(false);
    setAnswerValue("");
  }, [state.currentIndex]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
    questionStartTime.current = Date.now();
    setAiFeedback(null);
    setAnswerValue("");
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" });
    loadDueWords();
  }, [loadDueWords]);

  const getCorrectAnswer = useCallback((question: QuizQuestion): string => {
    switch (question.mode) {
      case "type_pinyin":
        return question.pinyin;
      case "type_character":
        return question.word;
      case "multiple_choice":
        return question.english;
      default:
        return "";
    }
  }, []);

  const validateAnswer = useCallback((userAnswer: string, question: QuizQuestion): boolean => {
    switch (question.mode) {
      case "multiple_choice":
        return userAnswer.toLowerCase() === question.english.toLowerCase();
      case "type_pinyin":
        return validatePinyinAnswer(userAnswer, question.pinyin);
      case "type_character":
        return userAnswer === question.word;
      default:
        return false;
    }
  }, []);

  const handleAnswer = useCallback(
    async (userAnswer: string) => {
      const currentQuestion = state.questions[state.currentIndex];
      const correct = validateAnswer(userAnswer, currentQuestion);
      const timeSpentMs = Date.now() - questionStartTime.current;

      // Clear previous AI feedback
      setAiFeedback(null);
      setFeedbackLoading(false);

      // Optimistic UI: Show feedback immediately with word details
      dispatch({
        type: "SUBMIT_ANSWER",
        answer: {
          wordId: currentQuestion.wordId,
          word: currentQuestion.word,
          pinyin: currentQuestion.pinyin,
          english: currentQuestion.english,
          questionType: currentQuestion.mode,
          userAnswer,
          correct,
          timestamp: new Date(),
        },
      });

      // Generate AI feedback for incorrect answers (async, non-blocking)
      if (!correct) {
        setFeedbackLoading(true);
        generateFeedback({
          wordId: currentQuestion.wordId,
          userAnswer,
          correctAnswer: getCorrectAnswer(currentQuestion),
          questionType: currentQuestion.mode,
        })
          .then((response) => {
            setAiFeedback(response.explanation);
            setFeedbackLoading(false);
          })
          .catch((err) => {
            console.error("AI feedback generation failed:", err);
            setFeedbackLoading(false);
          });
      }

      // Save to backend and capture gamification data
      try {
        const result = await saveTestResult({
          wordId: currentQuestion.wordId,
          correct,
          questionType: currentQuestion.mode,
          timeSpentMs,
        });

        // Update answer with backend metadata
        dispatch({
          type: "UPDATE_ANSWER_METADATA",
          wordId: currentQuestion.wordId,
          nextReview: result.nextReviewDate,
          lapseCount: result.lapseCount,
        });

        // Capture gamification data
        if (result.xpEarned !== undefined) {
          dispatch({ type: "ADD_XP_EARNED", xp: result.xpEarned });
        }

        if (result.mysteryBox) {
          dispatch({ type: "SET_MYSTERY_BOX", mysteryBox: result.mysteryBox });
        }

        if (result.newBadges && result.newBadges.length > 0) {
          const convertedBadges = result.newBadges.map((apiBadge) => ({
            id: apiBadge.id,
            name: apiBadge.name,
            description: `Maintain a ${apiBadge.streakRequired}-day streak`,
            icon: apiBadge.icon,
            streakRequired: apiBadge.streakRequired,
            earnedDate: new Date(),
          }));

          dispatch({ type: "ADD_NEW_BADGES", badges: convertedBadges });
        }

        if (result.freezeAwarded !== undefined) {
          dispatch({ type: "SET_FREEZE_AWARDED", awarded: result.freezeAwarded });
        }
      } catch (err) {
        console.error("Failed to save test result:", err);
      }
    },
    [
      state.questions,
      state.currentIndex,
      validateAnswer,
      getCorrectAnswer,
      generateFeedback,
      saveTestResult,
    ],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (answerValue.trim().length === 0) return;
    handleAnswer(answerValue.trim().toLowerCase());
    setAnswerValue("");
  }, [answerValue, handleAnswer]);

  const toggleHint = useCallback(() => {
    setShowHint((prev) => !prev);
  }, []);

  // ============================================================================
  // Context Values
  // ============================================================================

  const currentQuestion =
    state.questions.length > 0 && state.currentIndex < state.questions.length
      ? state.questions[state.currentIndex]
      : null;

  const stateValue: QuizStateContext = {
    phase: state.phase,
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: state.answers,
    error: state.error,
    currentQuestion,
    answerValue,
    showHint,
    aiFeedback,
    feedbackLoading,
    totalXP: state.totalXP,
    mysteryBox: state.mysteryBox,
    newBadges: state.newBadges,
    freezeAwarded: state.freezeAwarded,
  };

  const actionsValue: QuizActionsContext = {
    handleAnswer,
    handleSubmitAnswer,
    handleNext,
    handleRetry,
    setAnswerValue,
    toggleHint,
    getCorrectAnswer,
    validateAnswer,
  };

  return (
    <QuizStateCtx.Provider value={stateValue}>
      <QuizActionsCtx.Provider value={actionsValue}>{children}</QuizActionsCtx.Provider>
    </QuizStateCtx.Provider>
  );
}
