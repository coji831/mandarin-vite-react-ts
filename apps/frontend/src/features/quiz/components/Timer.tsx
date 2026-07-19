/**
 * Timer.tsx
 * Phase 1 Gate Quiz — Countdown display
 *
 * Reads timer from store. Formats as M:SS.
 * Shows ⏱ prefix. Warning color at <30s, danger at <10s.
 */

import { Box } from "shared/components";
import { useQuizSessionStore } from "../stores/quizSessionStore";

/** Countdown timer display */
export function Timer() {
  const timer = useQuizSessionStore((s) => s.timer);

  const isExpired = timer <= 0;
  const minutes = Math.floor(Math.max(timer, 0) / 60);
  const seconds = Math.max(timer, 0) % 60;
  const formatted = isExpired ? "0:00" : `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isDanger = timer > 0 && timer < 10;
  const isWarning = timer > 0 && timer < 30;

  const timerStateClass = isExpired
    ? "text-error"
    : isDanger
      ? "text-error"
      : isWarning
        ? "text-warning"
        : "";

  return (
    <Box padding="sm" className={`flex-col-center quiz-timer gap-xs ${timerStateClass}`}>
      <span>{isExpired ? "⏰" : "⏱"}</span>
      <span className="quiz-timer__value font-md">{isExpired ? "Time's up!" : formatted}</span>
    </Box>
  );
}
