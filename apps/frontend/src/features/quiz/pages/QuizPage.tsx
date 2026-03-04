/**
 * QuizPage
 * Epic 15: Learning Retention - Quiz session page
 * Story 15.6: Quiz Container & State Management (original)
 * Story 15.8: Backend API Integration with optimistic UI
 * Story 15.9: Gamification & AI feedback integration
 * Story 15.11: Aligned with Epic 4 feature-based routing pattern
 *
 * Manages quiz session lifecycle:
 * - Wraps quiz in QuizProvider context
 * - Routes between phases: LOADING → QUESTION/ANSWER_FEEDBACK → COMPLETE/ERROR
 * - Pure phase routing based on quiz state
 * - All business logic delegated to QuizContext
 *
 * Phase Routing:
 * - LOADING: Shows loading spinner while fetching due words
 * - ERROR: Shows error screen with retry option
 * - QUESTION: Shows exam layout with question + answer section
 * - ANSWER_FEEDBACK: Shows feedback section with AI explanation
 * - COMPLETE: Shows results layout with stats, badges, XP
 */

import { QuizProvider, useQuizState, useQuizActions } from "../contexts";
import { ExamLayout, ResultsLayout, ErrorScreen, LoadingScreen } from "../components";
import "./QuizPage.css";

export function QuizPage() {
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
