/**
 * QuizPage
 * Epic 15: Learning Retention - Quiz session page
 * Story 15.6: Quiz Container & State Management (original)
 * Story 15.8: Backend API Integration with optimistic UI
 * Story 15.9: Gamification & AI feedback integration
 * Story 15.11: Aligned with Epic 4 feature-based routing pattern
 * Phase 4 restructure: Moved from features/quiz/pages/ to pages/ orchestrator layer
 * Story 17.6: Removed QuizProvider — quiz state uses quizSessionStore directly
 * Story 18.6: Added audio-to-type quiz support via ?type=audio-to-type query param
 *              Phase 1 migration: routes to QuizSessionPage for registered strategies
 * Phase 2 cleanup: Removed old SRS quiz fallback (features/review dependency)
 *              Shows "select a quiz type" message for unregistered strategies
 */

import { useSearchParams } from "react-router-dom";
import { QuizSessionPage } from "./QuizSessionPage";
import { QuizDebugPage } from "./QuizDebugPage";
import { getStrategy } from "../../features/quiz/engine/strategies";
import type { StrategyType } from "../../features/quiz/types";
import { practices_page } from "../../shared/constants/paths";

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const quizType = searchParams.get("type");

  // Route to debug page
  if (quizType === "_debug") {
    return <QuizDebugPage />;
  }

  // Route to strategy-based quiz if type matches registry
  if (quizType && getStrategy(quizType)) {
    return <QuizSessionPage strategyType={quizType as StrategyType} />;
  }

  // Fallback — no matching strategy selected
  return (
    <div className="flex-col-center p-2xl gap-lg">
      <h2 className="font-xl text-primary m-0">📝 Quiz</h2>
      <p className="text-secondary text-center" style={{ maxWidth: 400 }}>
        Select a quiz type from the practices page to begin.
      </p>
      <a
        href={practices_page}
        className="btn-primary"
        style={{ textDecoration: "none", padding: "var(--space-md) var(--space-xl)" }}
      >
        Back to Practices
      </a>
    </div>
  );
}
