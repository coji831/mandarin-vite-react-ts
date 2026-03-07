/**
 * EmptyStateScreen Component
 * Flow 1.2: No Due Words Available - Celebration state when all caught up
 *
 * Displays positive message when user has no vocabulary due for review.
 * Shows celebration icon and encouraging message (no retry button per spec).
 */

import "./EmptyStateScreen.css";

export { EmptyStateScreen };

type EmptyStateScreenProps = {
  message?: string;
};

function EmptyStateScreen({ message = "You're all caught up! 🎉" }: EmptyStateScreenProps) {
  return (
    <div className="emptyState flex-col-center text-center">
      <div className="emptyStateIcon">🎉</div>
      <h2 className="emptyStateTitle">All Caught Up!</h2>
      <p className="emptyStateMessage">{message}</p>
      <p className="emptyStateSubtext">
        Come back later when more vocabulary is due for review based on your spaced repetition
        schedule.
      </p>
    </div>
  );
}
