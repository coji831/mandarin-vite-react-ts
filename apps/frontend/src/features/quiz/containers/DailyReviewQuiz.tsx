/**
 * Daily Review Quiz Container
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Backend API Integration with optimistic UI
 * Story 15.9: Gamification & AI feedback integration
 *
 * Main quiz container orchestrating state machine flow:
 * - Fetches due words from backend API on mount
 * - Manages answer validation and feedback
 * - Saves test results to backend (optimistic, non-blocking)
 * - Captures gamification data (XP, badges, mystery box, freezes)
 * - Generates AI-powered error explanations (async, 3s timeout)
 * - Auto-advances after 1.5s feedback delay
 * - Composes Story 15.5 components (QuizCard, TypeAnswerInput, ToneInput)
 * - Handles error states with retry functionality
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
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
import { useGenerateFeedback } from "../hooks/useAIFeedback";
import { initialState, quizReducer } from "../reducers/quizReducer";
import { QuizQuestion } from "../types/QuizTypes";
import { createInterleavedQuestions } from "../utils/interleaving";

export function DailyReviewQuiz() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const { fetchDueWords } = useFetchDueWords();
  const { saveTestResult } = useSaveTestResult();
  const { generateFeedback } = useGenerateFeedback(); // Story 15.9: AI feedback hook
  const questionStartTime = useRef<number>(0);

  // Story 15.9: AI feedback state
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

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

  const handleNext = () => {
    dispatch({ type: "NEXT_QUESTION" });
    questionStartTime.current = Date.now();
    setAiFeedback(null);
  };

  const handleAnswer = async (userAnswer: string) => {
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

    // Story 15.9: Generate AI feedback for incorrect answers (async, non-blocking)
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
          // User will manually click "Next" button to advance
        })
        .catch((err) => {
          console.error("AI feedback generation failed:", err);
          setFeedbackLoading(false);
          // User will manually click "Next" button even if feedback fails
        });
    } else {
      // For correct answers, auto-advance after 1.5s (no feedback to wait for)
      setTimeout(() => {
        dispatch({ type: "NEXT_QUESTION" });
        questionStartTime.current = Date.now();
        setAiFeedback(null);
      }, 1500);
    }

    // Save to backend and capture ALL gamification data (Story 15.9)
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

      // Capture gamification data for quiz summary (Story 15.9)
      if (result.xpEarned !== undefined) {
        dispatch({
          type: "ADD_XP_EARNED",
          xp: result.xpEarned,
        });
      }

      if (result.mysteryBox) {
        dispatch({
          type: "SET_MYSTERY_BOX",
          mysteryBox: result.mysteryBox,
        });
      }

      if (result.newBadges && result.newBadges.length > 0) {
        // Convert API Badge format to frontend Badge format
        const convertedBadges = result.newBadges.map((apiBadge) => ({
          id: apiBadge.id,
          name: apiBadge.name,
          description: `Maintain a ${apiBadge.streakRequired}-day streak`, // Generate description from streakRequired
          icon: apiBadge.icon,
          streakRequired: apiBadge.streakRequired,
          earnedDate: new Date(),
        }));

        dispatch({
          type: "ADD_NEW_BADGES",
          badges: convertedBadges,
        });
      }

      if (result.freezeAwarded !== undefined) {
        dispatch({
          type: "SET_FREEZE_AWARDED",
          awarded: result.freezeAwarded,
        });
      }
    } catch (err) {
      // Non-blocking: Log error but don't interrupt quiz flow
      console.error("Failed to save test result:", err);
      // In production, could show toast notification here
    }
  };

  // Helper to get correct answer for AI feedback
  const getCorrectAnswer = (question: QuizQuestion): string => {
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

  // Complete state (Story 15.9: Pass gamification data to QuizComplete)
  if (state.phase === "COMPLETE") {
    return (
      <QuizComplete
        answers={state.answers}
        totalXP={state.totalXP}
        mysteryBox={state.mysteryBox}
        newBadges={state.newBadges}
        freezeAwarded={state.freezeAwarded}
        onReviewAgain={handleRetry}
      />
    );
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
          key={state.currentIndex} // Force remount on question change to clear input
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

          {/* Story 15.9: AI-generated feedback for incorrect answers */}
          {!lastAnswer.correct && (
            <div className="aiFeedbackSection">
              {feedbackLoading && <p className="aiFeedbackLoading">💭 Generating feedback...</p>}
              {/* Show Next button after feedback loads or fails */}
              {!feedbackLoading && (
                <button className="nextButton" onClick={handleNext}>
                  Next Question →
                </button>
              )}
              {aiFeedback && !feedbackLoading && (
                <div className="aiFeedbackBox">
                  <p className="aiFeedbackLabel">💡 Tip:</p>
                  <p className="aiFeedbackText">{aiFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
