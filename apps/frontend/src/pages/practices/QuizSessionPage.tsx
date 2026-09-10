/**
 * QuizSessionPage.tsx
 * Phase 1 Gate Quiz — Orchestrator page
 *
 * Top-level page component for a strategy-based quiz session.
 * Renders header with title + timer, QuizRouter, and progress bar.
 *
 * Wireframe Section 4.6 layout.
 */

import {
  useQuizSessionStore,
  useQuizEngine,
  QuizRouter,
  Timer,
  QuizProgressBar,
} from "../../features/quiz";
import { getStrategy } from "features/quiz";
import { LoadingScreen, PageHeader, PageShell, PageStack } from "shared/components";

import type { StrategyType } from "../../features/quiz/types";

type QuizSessionPageProps = {
  strategyType: StrategyType;
};

/** Full quiz session orchestrator with header, content, and progress bar */
export function QuizSessionPage({ strategyType }: QuizSessionPageProps) {
  useQuizEngine(strategyType);

  const strategy = getStrategy(strategyType);
  const strategyConfig = useQuizSessionStore((s) => s.strategyConfig);
  const phase = useQuizSessionStore((s) => s.phase);
  const score = useQuizSessionStore((s) => s.score);
  const totalQuestions = useQuizSessionStore((s) => s.questions.length);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);

  // Loading state
  if (phase === "LOADING") {
    return <LoadingScreen message="Loading quiz..." />;
  }

  const isQuestionPhase = phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK";

  return (
    <PageShell archetype="focus-task">
      <PageStack size="default">
        <PageHeader
          title={strategy ? `Quiz: ${strategy.label}` : "Quiz"}
          description={
            isQuestionPhase ? `Question ${currentIndex + 1} of ${totalQuestions}` : undefined
          }
        >
          <Timer />
        </PageHeader>

        {/* Main content */}
        <QuizRouter />

        {/* Progress bar at bottom */}
        {isQuestionPhase && (
          <QuizProgressBar
            current={score}
            total={totalQuestions}
            passThreshold={strategyConfig?.passThreshold}
            isPractice={false}
          />
        )}
      </PageStack>
    </PageShell>
  );
}
