/**
 * PhaseGateBadge.tsx
 * Phase 1 Gate Quiz — Celebration badge with animation
 *
 * Displays an animated badge indicating whether the user passed or failed.
 */

interface PhaseGateBadgeProps {
  passed: boolean;
}

/** Animated gate pass/fail badge */
export function PhaseGateBadge({ passed }: PhaseGateBadgeProps) {
  return (
    <div
      className={`quiz-badge font-xl fw-700 py-sm px-lg radius-md ${passed ? "quiz-badge--pass" : "quiz-badge--fail"}`}
    >
      {passed ? "Phase 2 unlocked! 🎉" : "🔒 Keep Practicing"}
    </div>
  );
}
