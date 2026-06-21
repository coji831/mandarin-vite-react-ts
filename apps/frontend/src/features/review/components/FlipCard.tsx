/**
 * FlipCard.tsx
 * Phase 1 Review — Tap to flip card with front/back display.
 */
import type { ReviewItem } from "../types";
import "./FlipCard.css";

interface FlipCardProps {
  item: ReviewItem;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlipCard({ item, isFlipped, onFlip }: FlipCardProps) {
  return (
    <div
      className="flip-card card-dark flex-col-center gap-md cursor-pointer"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      aria-label={
        isFlipped
          ? "Review answer shown. Tap to see question."
          : "Review question. Tap to see answer."
      }
    >
      {isFlipped ? (
        <>
          <span className="flip-card__back fw-700 text-success font-2xl">{item.back}</span>
          <span className="flip-card__hint text-tertiary fw-400 font-sm">Tap to see question</span>
        </>
      ) : (
        <>
          <span className="flip-card__front fw-700 text-primary font-2xl">{item.front}</span>
          <span className="flip-card__hint text-tertiary font-sm">Tap to reveal answer</span>
        </>
      )}
    </div>
  );
}
