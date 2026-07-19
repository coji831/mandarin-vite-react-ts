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
import "./PracticesPage.css";

export default function PracticesPage() {
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const { currentPhase, label, quizzes, takeQuiz, timeline } = useQuizCard();

  return (
    <div className="flex-col gap-lg mx-auto max-w-700">
      <div className="text-center flex-col gap-xs">
        <h1 className="font-4xl fw-800 text-primary m-0">🎯 Practices</h1>
        <p className="font-md text-muted m-0">Review and Quiz</p>
      </div>
      <div className="cardGrid grid-2-col gap-lg w-full">
        {isAuthenticated ? <ReviewLaunchCard /> : <ReviewPromptCard />}
        <QuizCard
          isGuest={isGuest}
          currentPhase={currentPhase}
          label={label}
          quizzes={quizzes}
          takeQuiz={takeQuiz}
          timeline={timeline}
        />
      </div>
    </div>
  );
}
