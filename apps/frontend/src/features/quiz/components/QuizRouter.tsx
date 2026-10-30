/**
 * QuizRouter.tsx
 * Phase 1 Gate Quiz — Phase-based UI switch
 *
 * Reads the current quiz phase from the store and renders the corresponding
 * view: LOADING, QUESTION, INPUT, FEEDBACK, RESULTS, or ERROR.
 *
 * The QUESTION/INPUT surface is chosen by `QUESTION_VIEWS` (see
 * `questionViews.ts`) — the dispatch contract, §26.3.1.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";
import { FeedbackView } from "./FeedbackView";
import { QuizResults } from "./results/QuizResults";
import { QuestionView } from "./QuestionView";
import { QUESTION_VIEWS } from "./questionViews";
import { ErrorScreen, LoadingScreen, Spinner } from "shared/components";

/** Phase-based routing with all phases */
export function QuizRouter() {
  const phase = useQuizSessionStore((s) => s.phase);
  const error = useQuizSessionStore((s) => s.error);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const retry = useQuizSessionStore((s) => s.retry);

  switch (phase) {
    case "LOADING":
      return (
        <div className="flex-col-center gap-sm">
          <Spinner size="lg" />
          <p className="text-secondary font-md m-0">Loading quiz...</p>
        </div>
      );
    case "QUESTION":
    case "INPUT": {
      const QuestionSurface = QUESTION_VIEWS[strategyType] ?? QuestionView;
      return <QuestionSurface />;
    }
    case "FEEDBACK":
      return <FeedbackView />;
    case "RESULTS":
      return <QuizResults />;
    case "ERROR":
      return <ErrorScreen error={error ?? "An unknown error occurred"} onRetry={() => retry()} />;
    default:
      return <LoadingScreen message="Loading quiz..." />;
  }
}
