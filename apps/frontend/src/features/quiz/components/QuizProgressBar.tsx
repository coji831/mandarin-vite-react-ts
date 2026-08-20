/**
 * QuizProgressBar.tsx
 * Phase 1 Gate Quiz — Score progress bar
 *
 * Shows current score vs total, progress fill, percentage,
 * and pass threshold warning line.
 */

import { Box, ProgressBar } from "shared/components";

type QuizProgressBarProps = {
  /** Current score (number of correct answers) */
  current: number;
  /** Total questions */
  total: number;
  /** Pass threshold as a fraction (0-1). Default 0.9 (90%). */
  passThreshold?: number;
  /** Is this a practice mode (no pass/fail)? */
  isPractice?: boolean;
};

/** Score progress bar with pass threshold */
export function QuizProgressBar({
  current,
  total,
  passThreshold = 0.9,
  isPractice = false,
}: QuizProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const thresholdPct = Math.round(passThreshold * 100);
  const passed = pct >= thresholdPct;
  const needCorrect = Math.ceil(total * passThreshold);

  return (
    <Box variant="dark" padding="md" className="flex-col gap-sm">
      {/* Track with fill */}
      <ProgressBar
        value={pct}
        threshold={isPractice ? undefined : thresholdPct}
        aria-label="Quiz score progress"
        className="bg-surface-dark-alt radius-pill"
      />

      {/* Stats row */}
      <div className="quiz-progress__stats flex-between gap-sm font-sm">
        <span className="text-secondary fw-600">
          {current}/{total} correct ({pct}%)
        </span>
        {isPractice ? (
          <span className="text-secondary fw-500">Score: {pct}%</span>
        ) : !passed ? (
          <span className="text-warning fw-500">
            ⚠️ Need {needCorrect}/{total} to pass
          </span>
        ) : (
          <span className="text-success fw-600">✅ Passing</span>
        )}
      </div>
    </Box>
  );
}
