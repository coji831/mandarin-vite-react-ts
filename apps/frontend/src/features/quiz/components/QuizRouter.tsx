/**
 * QuizRouter.tsx
 * Phase 1 Gate Quiz — Phase-based UI switch
 *
 * Reads the current quiz phase from the store and renders the
 * corresponding view: LOADING, QUESTION, INPUT, FEEDBACK, RESULTS, or ERROR.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";
import { QuestionView } from "./QuestionView";
import { FeedbackView } from "./FeedbackView";
import { QuizResults } from "./results/QuizResults";
import { IMEQuestionView } from "./ime-input/IMEQuestionView";

/** Phase-based routing with all phases */
export function QuizRouter() {
  const phase = useQuizSessionStore((s) => s.phase);
  const error = useQuizSessionStore((s) => s.error);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const retry = useQuizSessionStore((s) => s.retry);

  const showIMEQuestion =
    (phase === "QUESTION" || phase === "INPUT") && strategyType === "ime-simulator";

  switch (phase) {
    case "LOADING":
      return (
        <div className="quiz-loading">
          <div className="spinner" />
          <p>Loading quiz...</p>
        </div>
      );
    case "QUESTION":
    case "INPUT":
      if (showIMEQuestion) return <IMEQuestionView />;
      return <QuestionView />;
    case "FEEDBACK":
      return <FeedbackView />;
    case "RESULTS":
      return <QuizResults />;
    case "ERROR":
      return (
        <div className="card quiz-error flex-col-center gap-md p-lg">
          <p className="text-error fw-600">Error: {error}</p>
          <button className="btn-primary" onClick={() => retry()} type="button">
            Retry Quiz
          </button>
        </div>
      );
    default:
      return (
        <div className="quiz-loading">
          <div className="spinner" />
          <p>Loading quiz...</p>
        </div>
      );
  }
}
