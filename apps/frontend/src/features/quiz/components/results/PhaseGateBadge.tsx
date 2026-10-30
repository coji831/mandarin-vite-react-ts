/**
 * PhaseGateBadge.tsx
 * Phase 1 Gate Quiz — Celebration badge with animation
 *
 * Displays an animated badge indicating whether the user passed or failed.
 * Supports configurable phase number via unlockedPhase prop.
 * Guest-aware messaging when isGuest is true.
 *
 * Rework (§7 close-out): the message is text. The 🎉/🔒 glyphs are gone — a
 * padlock on a failed quiz reads as a lock the learner must break, when the only
 * lock BM-1 sanctions is persistence, and emoji is not an icon (ADR-010 / Q8).
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
  // The completion slot owns the persistence ask (§26.2.3), so a guest's badge
  // states the fact and does not repeat the pitch: no row was written for them.
  const passMessage = isGuest
    ? "Great score. This result is not saved yet."
    : `Phase ${unlockedPhase} unlocked!`;
  const failMessage = isGuest
    ? "Keep practicing. This result is not saved yet."
    : "Keep Practicing";

  return (
    <Box
      className={`quiz-badge font-xl fw-700 p-sm radius-md ${passed ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}
    >
      {passed ? passMessage : failMessage}
    </Box>
  );
}
