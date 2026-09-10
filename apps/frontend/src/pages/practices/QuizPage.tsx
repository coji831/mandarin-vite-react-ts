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
 * Story 22.4 follow-up (Issue 4): `?type=` is validated through `parse` against
 * the strategy registry (invalid → no session), via useSearchParamState.
 */

import type { StrategyType } from "features/quiz";
import { getStrategy } from "features/quiz";
import { SEARCH_PARAMS, practices_page } from "shared/constants";
import { useSearchParamState } from "shared/hooks";
import { QuizSessionPage } from "./QuizSessionPage";
import { Button, PageHeader, PageShell, PageStack } from "shared/components";

export function QuizPage() {
  // Validate ?type= against the strategy registry — invalid/absent → null.
  const [quizType] = useSearchParamState<string | null>(SEARCH_PARAMS.type, {
    defaultValue: null,
    parse: (raw) => (raw && getStrategy(raw) ? raw : null),
  });

  // Route to strategy-based quiz if type matches registry
  if (quizType) {
    return <QuizSessionPage strategyType={quizType as StrategyType} />;
  }

  // Fallback — no matching strategy selected
  return (
    <PageShell archetype="focus-task">
      <PageStack size="default">
        <PageHeader title="Quiz" description="Select a quiz type from the practices page to begin.">
          <Button variant="primary" onClick={() => (window.location.href = practices_page)}>
            Back to Practices
          </Button>
        </PageHeader>
      </PageStack>
    </PageShell>
  );
}
