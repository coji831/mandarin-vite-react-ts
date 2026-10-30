/**
 * Timer.tsx
 * Phase 1 Gate Quiz — Countdown display
 *
 * Reads timer from store. Formats as M:SS. Warning colour at <30s, danger at
 * <10s, and the value gains a state word at both thresholds — urgency is never
 * carried by colour alone (WCAG 1.4.1).
 * No glyph: the countdown is a number the colour already qualifies, and emoji is
 * not an icon (ADR-010 / Q8).
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

  // The state word, not the colour, carries the urgency: "0:25 left" and
  // "0:08 left, almost out" stay distinguishable to a learner who cannot
  // separate the warning and error hues.
  const value = isExpired
    ? "Time's up!"
    : isDanger
      ? `${formatted} left, almost out`
      : isWarning
        ? `${formatted} left`
        : formatted;

  const timerStateClass = isExpired
    ? "text-error"
    : isDanger
      ? "text-error"
      : isWarning
        ? "text-warning"
        : "";

  return (
    <Box padding="sm" className={`flex-col-center quiz-timer gap-xs ${timerStateClass}`}>
      <span className="quiz-timer__value font-md">{value}</span>
    </Box>
  );
}
