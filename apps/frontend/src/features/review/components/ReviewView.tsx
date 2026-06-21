/**
 * ReviewView.tsx
 * Phase 1 Review — Main orchestrator component.
 * Manages the three-step flow: pick → flip → complete.
 */
import { useReview } from "../hooks/useReview";
import "./ReviewView.css";
import { ReviewPicker } from "./ReviewPicker";
import { FlipCard } from "./FlipCard";
import { RatingButtons } from "./RatingButtons";
import { ReviewComplete } from "./ReviewComplete";

type ReviewPhase = "pick" | "review" | "complete";

interface ReviewViewProps {
  onBack: () => void;
}

export function ReviewView({ onBack }: ReviewViewProps) {
  const { currentItem, isFlipped, flip, rate, completed, loading, error, startReview, progress } =
    useReview();

  // Determine current phase
  const phase: ReviewPhase = completed ? "complete" : currentItem ? "review" : "pick";

  if (loading) {
    return (
      <div className="flex-col-center gap-md p-2xl">
        <div className="spinner" />
        <p className="text-muted">Loading review items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-col-center gap-md">
        <p className="text-error">Error: {error}</p>
        <button className="btn-primary" onClick={() => startReview("due", "pinyin")} type="button">
          Try Again
        </button>
      </div>
    );
  }

  switch (phase) {
    case "pick":
      return <ReviewPicker onStart={startReview} />;

    case "review":
      return (
        <div className="review-view__container flex-col gap-lg mx-auto">
          {/* Progress header */}
          <div className="flex-center flex-between">
            <span className="review-view__counter text-secondary fw-600">
              {progress.current} of {progress.total}
            </span>
          </div>

          {/* Flip card */}
          <FlipCard item={currentItem!} isFlipped={isFlipped} onFlip={flip} />

          {/* Rating buttons (only show after flip) */}
          {isFlipped && <RatingButtons onRate={rate} />}
        </div>
      );

    case "complete":
      return (
        <ReviewComplete
          total={progress.total}
          onReviewMore={() => startReview("due", "pinyin")}
          onBack={onBack}
        />
      );
  }
}
