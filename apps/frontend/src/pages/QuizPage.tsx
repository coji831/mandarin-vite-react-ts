/**
 * QuizPage
 * Epic 15: Learning Retention - Quiz session page
 * Story 15.6: Quiz Container & State Management (original)
 * Story 15.8: Backend API Integration with optimistic UI
 * Story 15.9: Gamification & AI feedback integration
 * Story 15.11: Aligned with Epic 4 feature-based routing pattern
 * Phase 4 restructure: Moved from features/quiz/pages/ to pages/ orchestrator layer
 *
 * Manages quiz session lifecycle:
 * - Wraps quiz in QuizProvider context
 * - Routes between phases: LOADING → QUESTION/ANSWER_FEEDBACK → RESULTS/ERROR
 * - Pure phase routing based on quiz state
 * - All business logic delegated to QuizContext
 *
 * Phase Routing:
 * - LOADING: Shows loading spinner while fetching due words
 * - ERROR: Shows error screen with retry option
 * - QUESTION: Shows exam layout with question + answer section
 * - ANSWER_FEEDBACK: Shows feedback section with AI explanation
 * - RESULTS: Shows results layout with stats, badges, XP and countdown timer
 */

import {
  QuizProvider,
  useQuizState,
  useQuizActions,
  ExamLayout,
  ResultsLayout,
  ErrorScreen,
  LoadingScreen,
} from "features/quiz";
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

    case "RESULTS":
      return <ResultsLayout />;

    default:
      return null;
  }
}
