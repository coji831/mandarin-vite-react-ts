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
import { MultipleChoiceView } from "./MultipleChoiceView";
import { ErrorScreen, LoadingScreen, Spinner } from "shared/components";

/** Quiz types that use multiple-choice rendering */
const MULTIPLE_CHOICE_STRATEGIES = new Set(["radical-gate"]);

/** Phase-based routing with all phases */
export function QuizRouter() {
  const phase = useQuizSessionStore((s) => s.phase);
  const error = useQuizSessionStore((s) => s.error);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const retry = useQuizSessionStore((s) => s.retry);

  const showIMEQuestion =
    (phase === "QUESTION" || phase === "INPUT") && strategyType === "ime-simulator";
  const showMultipleChoice =
    (phase === "QUESTION" || phase === "INPUT") && MULTIPLE_CHOICE_STRATEGIES.has(strategyType);

  switch (phase) {
    case "LOADING":
      return (
        <div className="flex-col-center gap-sm">
          <Spinner size="lg" />
          <p className="text-secondary font-md m-0">Loading quiz...</p>
        </div>
      );
    case "QUESTION":
    case "INPUT":
      if (showIMEQuestion) return <IMEQuestionView />;
      if (showMultipleChoice) return <MultipleChoiceView />;
      return <QuestionView />;
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
