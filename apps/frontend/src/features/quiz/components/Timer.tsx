/**
 * Timer.tsx
 * Phase 1 Gate Quiz — Countdown display
 *
 * Reads timer from store. Formats as M:SS.
 * Shows ⏱ prefix. Warning color at <30s, danger at <10s.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";

/** Countdown timer display */
export function Timer() {
  const timer = useQuizSessionStore((s) => s.timer);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isDanger = timer < 10;
  const isWarning = timer < 30;

  const timerClass = isDanger ? "quiz-timer--danger" : isWarning ? "quiz-timer--warning" : "";

  return (
    <div
      className={`card-dark flex-col-center quiz-timer gap-xs py-sm px-md radius-md ${timerClass}`}
    >
      <span>⏱</span>
      <span className="quiz-timer__value font-md">{formatted}</span>
    </div>
  );
}
