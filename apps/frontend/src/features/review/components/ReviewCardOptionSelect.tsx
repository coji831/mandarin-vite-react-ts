/**
 * ReviewCardOptionSelect.tsx
 * Review card with multiple-choice option buttons.
 * Used by RadicalMeaningReviewStrategy — shows glyph + meaning options.
 */
import React from "react";
import type { ReviewItem } from "../types";
import { openHub } from "shared/store";
import { Box, Button } from "shared/components";
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
    <Box variant="dark" padding="md" className="review-card flex-col w-full">
      <div className="review-card__side flex-col-center gap-lg p-xl w-full">
        {/* Character / Glyph display */}
        <div className="review-card__character-display flex-col-center gap-md">
          <button
            type="button"
            className="review-card__character review-card__character-btn"
            onClick={() =>
              openHub({
                entityType: "character",
                entityId: displayChar,
                label: item.pinyinPlain ?? item.front,
              })
            }
            aria-label={`View details for ${displayChar}`}
          >
            {displayChar}
          </button>
        </div>

        {/* Audio button */}
        <Button
          variant="circle"
          size="sm"
          className="review-card__audio-btn"
          onClick={() => onPlayAudio(displayChar)}
          aria-label="Play audio"
        >
          🔊
        </Button>

        {/* Option buttons */}
        <p className="font-sm text-secondary m-0">What does this radical mean?</p>
        <div className="flex flex-wrap gap-sm w-full ">
          {options.map((opt) => (
            <Button
              key={opt.id}
              variant="secondary"
              size="sm"
              onClick={() => onSelectOption(opt.id)}
            >
              {opt.meaning}
            </Button>
          ))}
        </div>
      </div>
    </Box>
  );
}

export const ReviewCardOptionSelect = React.memo(ReviewCardOptionSelectComponent);
