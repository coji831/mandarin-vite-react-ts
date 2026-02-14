/**
 * Daily Review Quiz Container
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Backend API Integration with optimistic UI
 *
 * Main quiz container orchestrating state machine flow:
 * - Fetches due words from backend API on mount
 * - Manages answer validation and feedback
 * - Saves test results to backend (optimistic, non-blocking)
 * - Auto-advances after 1.5s feedback delay
 * - Composes Story 15.5 components (QuizCard, TypeAnswerInput, ToneInput)
 * - Handles error states with retry functionality
 */

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  QuizCard,
  QuizComplete,
  QuizError,
  QuizLoading,
  QuizProgressBar,
  TypeAnswerInput,
} from "../components";
import "./DailyReviewQuiz.css";
import { useFetchDueWords, useSaveTestResult } from "../hooks/useQuizAPI";
import { initialState, quizReducer } from "../reducers/quizReducer";
import { QuizQuestion } from "../types/QuizTypes";
import { createInterleavedQuestions } from "../utils/interleaving";

export function DailyReviewQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { fetchDueWords } = useFetchDueWords();
  const { saveTestResult } = useSaveTestResult();
  const questionStartTime = useRef<number>(0);

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
  }, [fetchDueWords, dispatch]);

  // Fetch due words on mount
  useEffect(() => {
    loadDueWords();
  }, [loadDueWords]);

  const handleRetry = () => {
    dispatch({ type: "RESET_QUIZ" });
    loadDueWords();
  };

  const handleAnswer = async (userAnswer: string) => {
    const currentQuestion = state.questions[state.currentIndex];
    const correct = validateAnswer(userAnswer, currentQuestion);
    const timeSpentMs = Date.now() - questionStartTime.current;

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

    // Save to backend and capture response with nextReview/lapseCount
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
    } catch (err) {
      // Non-blocking: Log error but don't interrupt quiz flow
      console.error("Failed to save test result:", err);
      // In production, could show toast notification here
    }

    // Auto-advance after 1.5s
    setTimeout(() => {
      dispatch({ type: "NEXT_QUESTION" });
      questionStartTime.current = Date.now(); // Reset timer for next question
    }, 1500);
  };

  const validateAnswer = (userAnswer: string, question: QuizQuestion): boolean => {
    switch (question.mode) {
      case "multiple_choice":
        return userAnswer.toLowerCase() === question.english.toLowerCase();
      case "type_pinyin":
        return userAnswer.toLowerCase() === question.pinyin.toLowerCase();
      case "type_character":
        return userAnswer === question.word;
      default:
        return false;
    }
  };

  // Loading state
  if (state.phase === "LOADING") {
    return <QuizLoading />;
  }

  // Error state (Story 15.8)
  if (state.phase === "ERROR") {
    return <QuizError error={state.error || "An unknown error occurred"} onRetry={handleRetry} />;
  }

  // Complete state
  if (state.phase === "COMPLETE") {
    return <QuizComplete answers={state.answers} onReviewAgain={handleRetry} />;
  }

  // Question state
  const currentQuestion = state.questions[state.currentIndex];
  const lastAnswer = state.answers[state.answers.length - 1];

  return (
    <div className="dailyReviewContainer">
      <QuizProgressBar current={state.currentIndex + 1} total={state.questions.length} />

      <QuizCard
        question={currentQuestion}
        mode={currentQuestion.mode}
        options={currentQuestion.options}
        onAnswer={handleAnswer}
      />

      {currentQuestion.mode !== "multiple_choice" && (
        <TypeAnswerInput
          placeholder={
            currentQuestion.mode === "type_pinyin" ? "Type pinyin..." : "Type character..."
          }
          mode={currentQuestion.mode}
          onAnswer={handleAnswer}
        />
      )}

      {state.phase === "ANSWER_FEEDBACK" && lastAnswer && (
        <div
          className={`feedbackContainer ${lastAnswer.correct ? "feedbackCorrect" : "feedbackIncorrect"}`}
        >
          <p
            className={`feedbackText ${lastAnswer.correct ? "feedbackTextCorrect" : "feedbackTextIncorrect"}`}
          >
            {lastAnswer.correct ? "✓ Correct!" : "✗ Incorrect"}
          </p>
        </div>
      )}
    </div>
  );
}
