/**
 * ReviewComplete.tsx
 * Phase 1 Review — Completion summary screen.
 */
import "./ReviewComplete.css";

interface ReviewCompleteProps {
  total: number;
  onReviewMore: () => void;
  onBack: () => void;
}

export function ReviewComplete({ total, onReviewMore, onBack }: ReviewCompleteProps) {
  return (
    <div className="review-complete flex-col-center gap-lg mx-auto">
      <span className="review-complete__emoji">✅</span>
      <h2 className="review-complete__title text-primary m-0">Review Complete</h2>
      <p className="review-complete__message text-muted text-center m-0">
        You reviewed {total} item{total !== 1 ? "s" : ""}.
      </p>

      <div className="flex-center gap-md">
        <button className="btn-primary" onClick={onReviewMore} type="button">
          Review More
        </button>
        <button className="btn-secondary" onClick={onBack} type="button">
          Back to Practices
        </button>
      </div>
    </div>
  );
}
