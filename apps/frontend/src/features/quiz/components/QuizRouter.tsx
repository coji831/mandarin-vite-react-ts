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

/** Phase-based routing with all phases */
export function QuizRouter() {
  const phase = useQuizSessionStore((s) => s.phase);
  const error = useQuizSessionStore((s) => s.error);

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
      return <QuestionView />;
    case "FEEDBACK":
      return <FeedbackView />;
    case "RESULTS":
      return <QuizResults />;
    case "ERROR":
      return (
        <div className="card quiz-error">
          <p>Error: {error}</p>
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