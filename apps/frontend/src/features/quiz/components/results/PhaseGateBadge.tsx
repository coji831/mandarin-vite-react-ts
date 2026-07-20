/**
 * PhaseGateBadge.tsx
 * Phase 1 Gate Quiz — Celebration badge with animation
 *
 * Displays an animated badge indicating whether the user passed or failed.
 * Supports configurable phase number via unlockedPhase prop.
 * Guest-aware messaging when isGuest is true.
 */

import { Box } from "shared/components";

type PhaseGateBadgeProps = {
  passed: boolean;
  /** Which phase number is unlocked on pass. Defaults to 2 (Phase 1 → 2). */
  unlockedPhase?: number;
  /** When true, shows guest-appropriate messaging with registration CTA text. */
  isGuest?: boolean;
};

/** Animated gate pass/fail badge */
export function PhaseGateBadge({
  passed,
  unlockedPhase = 2,
  isGuest = false,
}: PhaseGateBadgeProps) {
  const passMessage = isGuest
    ? "🎉 Great score! Register to save your progress"
    : `Phase ${unlockedPhase} unlocked! 🎉`;
  const failMessage = isGuest
    ? "Keep practicing! Register to track your scores"
    : "🔒 Keep Practicing";

  return (
    <Box
      className={`quiz-badge font-xl fw-700 p-sm radius-md ${passed ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}
    >
      {passed ? passMessage : failMessage}
    </Box>
  );
}
