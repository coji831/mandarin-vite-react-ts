/**
 * Daily Review Quiz Container
 * Epic 19: State Refactor - Simplified to pure phase routing
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Backend API Integration with optimistic UI
 * Story 15.9: Gamification & AI feedback integration
 *
 * Simplified container that wraps quiz in context provider and routes between phases.
 * All state management, logic, and API calls moved to QuizContext.
 * Pure phase routing based on quiz state.
 */

import { QuizProvider, useQuizState, useQuizActions } from "../contexts";
import { ExamLayout, ResultsLayout, ErrorScreen, LoadingScreen } from "../components";
import "./DailyReviewQuiz.css";

export function DailyReviewQuiz() {
  return (
    <QuizProvider>
      <div className="dailyReviewContainer flex-center">
        <div className="quizContentWrapper flex-col">
          <QuizRouter />
        </div>
      </div>
    </QuizProvider>
  );
}

function QuizRouter() {
  const { phase, error } = useQuizState();
  const { handleRetry } = useQuizActions();

  switch (phase) {
    case "LOADING":
      return <LoadingScreen />;

    case "ERROR":
      return <ErrorScreen error={error || "An unknown error occurred"} onRetry={handleRetry} />;

    case "QUESTION":
    case "ANSWER_FEEDBACK":
      return <ExamLayout />;

    case "COMPLETE":
      return <ResultsLayout />;

    default:
      return null;
  }
}
