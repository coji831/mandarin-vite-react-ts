/**
 * PracticesPage
 *
 * Practices index page showing Review and Quiz cards.
 * Pure layout orchestrator — delegates card content to self-contained
 * ReviewLaunchCard and QuizCard components.
 *
 * Story 19.3: Redesigned with 2 clean pathways — Review and Phase Quiz.
 * Story 19.4: Cards extracted into feature-owned components with hooks.
 *
 * Rework (§1 / BM-1): Review is NOT a registered-only pathway. BM-1's only lock
 * is persistence, so the guest upsell card that used to occupy this slot is
 * gone — everyone gets ReviewLaunchCard, and a guest meets the one ask at the
 * END of a session ("Create an account to keep this queue"). For the same
 * reason the page no longer reads auth state at all: nothing on it is gated.
 */
import { ReviewLaunchCard } from "features/review";
import { QuizCard, useQuizCard } from "features/quiz";
import { PageGrid, PageHeader, PageShell, PageStack } from "shared/components";

export default function PracticesPage() {
  const { currentPhase, label, quizzes, takeQuiz, timeline } = useQuizCard();

  return (
    <PageShell archetype="overview">
      <PageStack size="default">
        <PageHeader title="Practices" description="Review and Quiz" />

        <PageGrid columns={2} aria-label="Practice modes">
          <div role="listitem" className="grid min-w-0">
            <ReviewLaunchCard />
          </div>
          <div role="listitem" className="grid min-w-0">
            <QuizCard
              currentPhase={currentPhase}
              label={label}
              quizzes={quizzes}
              takeQuiz={takeQuiz}
              timeline={timeline}
            />
          </div>
        </PageGrid>
      </PageStack>
    </PageShell>
  );
}
