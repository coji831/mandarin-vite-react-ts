/**
 * PhaseGateBadge.tsx
 * Phase 1 Gate Quiz — Celebration badge with animation
 *
 * Displays an animated badge indicating whether the user passed or failed.
 * Supports configurable phase number via unlockedPhase prop.
 */

type PhaseGateBadgeProps = {
  passed: boolean;
  /** Which phase number is unlocked on pass. Defaults to 2 (Phase 1 → 2). */
  unlockedPhase?: number;
};

/** Animated gate pass/fail badge */
export function PhaseGateBadge({ passed, unlockedPhase = 2 }: PhaseGateBadgeProps) {
  return (
    <div
      className={`quiz-badge font-xl fw-700 py-sm px-lg radius-md ${passed ? "quiz-badge--pass" : "quiz-badge--fail"}`}
    >
      {passed ? `Phase ${unlockedPhase} unlocked! 🎉` : "🔒 Keep Practicing"}
    </div>
  );
}
