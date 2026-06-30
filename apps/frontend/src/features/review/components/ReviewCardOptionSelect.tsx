/**
 * ReviewCardOptionSelect.tsx
 * Review card with multiple-choice option buttons.
 * Used by RadicalMeaningReviewStrategy — shows glyph + meaning options.
 */
import React from "react";
import type { ReviewItem } from "../types";
import "./ReviewCard.css";

type ReviewCardOptionSelectProps = {
  item: ReviewItem;
  onSelectOption: (optionId: string) => void;
  onPlayAudio: (text: string) => void;
};

function ReviewCardOptionSelectComponent({
  item,
  onSelectOption,
  onPlayAudio,
}: ReviewCardOptionSelectProps) {
  const displayChar = item.character ?? item.front;
  const options = item.options ?? [];

  return (
    <div className="review-card card-dark flex-col">
      <div className="review-card__side flex-col-center gap-lg p-xl">
        {/* Character / Glyph display */}
        <div className="review-card__character-display flex-col-center gap-md">
          <span className="review-card__character">{displayChar}</span>
        </div>

        {/* Audio button */}
        <button
          className="review-card__audio-btn flex-center"
          onClick={() => onPlayAudio(displayChar)}
          aria-label="Play audio"
          type="button"
        >
          🔊
        </button>

        {/* Option buttons */}
        <p className="font-sm text-secondary m-0">What does this radical mean?</p>
        <div className="flex-col gap-sm w-full" style={{ maxWidth: 320 }}>
          {options.map((opt) => (
            <button
              key={opt.id}
              className="btn-outline font-sm p-xs px-sm"
              onClick={() => onSelectOption(opt.id)}
              type="button"
            >
              {opt.meaning}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ReviewCardOptionSelect = React.memo(ReviewCardOptionSelectComponent);
