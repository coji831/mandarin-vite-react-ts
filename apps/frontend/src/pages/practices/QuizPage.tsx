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
 * Story 22.4 follow-up (Issue 4): `?type=` is validated through `parse` against
 * the strategy registry (invalid → no session), via useSearchParamState.
 *
 * Rework (§7): `?type=` is the SESSION (detail / Focus, per pageChrome's
 * session-query rule). Without it this route is the `empty` / Browse entry
 * surface — it used to print "Select a quiz type from the practices page" and
 * strand the learner there, so it is now an EmptyState whose single action is
 * the way back.
 */

import type { StrategyType } from "features/quiz";
import { getStrategy } from "features/quiz";
import { SEARCH_PARAMS, practices_page } from "shared/constants";
import { useSearchParamState } from "shared/hooks";
import { Button, EmptyState, PageShell, PageStack } from "shared/components";
import { useNavigate } from "react-router-dom";
import { QuizSessionPage } from "./QuizSessionPage";

export function QuizPage() {
  const navigate = useNavigate();

  // Validate ?type= against the strategy registry — invalid/absent → null.
  const [quizType] = useSearchParamState<string | null>(SEARCH_PARAMS.type, {
    defaultValue: null,
    parse: (raw) => (raw && getStrategy(raw) ? raw : null),
  });

  // Route to strategy-based quiz if type matches registry
  if (quizType) {
    return <QuizSessionPage strategyType={quizType as StrategyType} />;
  }

  // Entry surface — no quiz selected. One way out, no dead end.
  return (
    <PageShell archetype="empty">
      <PageStack size="default">
        <EmptyState
          icon="quiz"
          iconTone="accent"
          title="No quiz selected"
          description="Quizzes are started from Practices, where you pick the mode and the phase."
          action={
            <Button variant="primary" onClick={() => navigate(practices_page)}>
              Back to Practices
            </Button>
          }
        />
      </PageStack>
    </PageShell>
  );
}
