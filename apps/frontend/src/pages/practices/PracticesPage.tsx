/**
 * PracticesPage
 *
 * Practices index page showing Review and Quiz cards.
 * Pure layout orchestrator — delegates card content to self-contained
 * ReviewLaunchCard and QuizCard components.
 *
 * Story 19.3: Redesigned with 2 clean pathways — Review and Phase Quiz.
 * Story 19.4: Cards extracted into feature-owned components with hooks.
 */
import { ReviewLaunchCard, ReviewPromptCard } from "features/review";
import { QuizCard, useQuizCard } from "features/quiz";
import { useAuth } from "features/auth";
import { PageGrid, PageHeader, PageShell, PageStack } from "shared/components";

export default function PracticesPage() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const { currentPhase, label, quizzes, takeQuiz, timeline } = useQuizCard();

  return (
    <PageShell archetype="overview">
      <PageStack size="default">
        <PageHeader title="Practices" description="Review and Quiz" />

        <PageGrid columns={2} aria-label="Practice modes">
          <div role="listitem" className="grid min-w-0">
            {isAuthenticated ? <ReviewLaunchCard /> : <ReviewPromptCard />}
          </div>
          <div role="listitem" className="grid min-w-0">
            <QuizCard
              isGuest={isGuest}
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
