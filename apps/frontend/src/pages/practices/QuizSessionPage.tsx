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
import "./QuizSessionPage.css";

import type { StrategyType } from "../../features/quiz/types";

type QuizSessionPageProps = {
  strategyType: StrategyType;
};

/** Full quiz session orchestrator with header, content, and progress bar */
export function QuizSessionPage({ strategyType }: QuizSessionPageProps) {
  useQuizEngine(strategyType);

  const strategy = getStrategy(strategyType);
  const strategyConfig = useQuizSessionStore((s) => s.strategyConfig);

  // Category emoji and label
  const categoryEmoji = "\uD83D\uDCDD";
  const categoryLabel = "Quiz";
  const phaseLabel = strategy ? `${categoryEmoji} ${categoryLabel} — ${strategy.label}` : "Quiz";

  const phase = useQuizSessionStore((s) => s.phase);
  const score = useQuizSessionStore((s) => s.score);
  const totalQuestions = useQuizSessionStore((s) => s.questions.length);
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);

  // Loading state
  if (phase === "LOADING") {
    return (
      <div className="quiz-session-page flex-col gap-lg p-xl mx-auto">
        <div className="flex-col-center gap-md p-2xl text-muted">
          <div className="quiz-spinner radius-full" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-session-page flex-col gap-lg p-xl mx-auto">
      {/* Header */}
      <div className="card-dark flex-between gap-md p-md px-lg">
        <span className="fw-700 text-primary quiz-results__heading font-lg">{phaseLabel}</span>
        <Timer />
      </div>

      {/* Question counter + category badge (outside card, per wireframe) */}
      {(phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK") && (
        <div className="flex-center flex-between px-xs">
          <span className="text-secondary fw-600 font-md">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
      )}

      {/* Main content */}
      <QuizRouter />

      {/* Progress bar at bottom */}
      {(phase === "QUESTION" || phase === "INPUT" || phase === "FEEDBACK") && (
        <QuizProgressBar
          current={score}
          total={totalQuestions}
          passThreshold={strategyConfig?.passThreshold}
          isPractice={false}
        />
      )}
    </div>
  );
}
