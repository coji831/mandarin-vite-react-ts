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
import { ReviewLaunchCard } from "../../features/review/components/ReviewLaunchCard";
import { QuizCard } from "../../features/quiz/components/QuizCard";
import "./PracticesPage.css";

export default function PracticesPage() {
  return (
    <div className="flex-col gap-lg mx-auto" style={{ maxWidth: 700 }}>
      <div className="text-center flex-col gap-xs">
        <h1 className="font-4xl fw-800 text-primary m-0">🎯 Practices</h1>
        <p className="font-md text-muted m-0">Review and Quiz</p>
      </div>
      <div className="cardGrid">
        <ReviewLaunchCard />
        <QuizCard />
      </div>
    </div>
  );
}
