/**
 * @file ReviewCardToneSelect.tsx
 * @description Tone selection review card — character + meaning + tone buttons
 * This is the first (and only input) step for tone-syllable items.
 *
 * Shows 5 tone buttons (1st/2nd/3rd/4th/neutral) for the user to select from.
 */

import React from "react";
import type { ReviewItem } from "../types";
import { TONE_BUTTONS_BASE } from "shared/constants/toneMap";
import "./ReviewCard.css";

type ReviewCardToneSelectProps = {
  item: ReviewItem;
  onSelectTone: (tone: number) => void;
  onPlayAudio: (text: string) => void;
  showMeaning?: boolean;
};

function ReviewCardToneSelectComponent({
  item,
  onSelectTone,
  onPlayAudio,
  showMeaning = true,
}: ReviewCardToneSelectProps) {
  const displayChar = item.character ?? item.front;

  return (
    <div className="review-card card-dark flex-col">
      <div className="review-card__side flex-col-center gap-lg p-xl">
        <div className="review-card__character-display flex-col-center gap-sm">
          <span className="review-card__character">{displayChar}</span>
          {item.meaning && showMeaning !== false && (
            <span className="review-card__meaning text-secondary fw-500 font-md">
              ({item.meaning})
            </span>
          )}
        </div>

        <div className="flex-center gap-md">
          <button
            className="review-card__audio-btn flex-center"
            onClick={() => onPlayAudio(displayChar)}
            aria-label="Play audio"
            type="button"
          >
            {"\uD83D\uDD0A"}
          </button>
        </div>

        <div className="flex-col-center gap-md w-full">
          <label className="text-secondary fw-500 font-sm">Select the correct tone:</label>
          <div className="review-card__tone-buttons flex-center gap-sm flex-wrap">
            {TONE_BUTTONS_BASE.map((btn) => (
              <button
                key={btn.tone}
                className="review-card__tone-btn flex-col-center gap-xs p-sm radius-md cursor-pointer grow-1 transition-all"
                data-tone={btn.tone}
                onClick={() => onSelectTone(btn.tone)}
                type="button"
              >
                <span className="review-card__tone-btn-mark fw-700 font-lg lh-1">
                  {btn.mark}
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ReviewCardToneSelect = React.memo(ReviewCardToneSelectComponent);
