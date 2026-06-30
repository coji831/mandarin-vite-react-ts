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
          <label className="text-secondary fw-500 font-sm" id="tone-select-label">
            Select the correct tone:
          </label>
          <div
            className="review-card__tone-buttons flex-center gap-sm flex-wrap"
            role="radiogroup"
            aria-labelledby="tone-select-label"
          >
            {TONE_BUTTONS_BASE.map((btn, index) => (
              <button
                key={btn.tone}
                className="review-card__tone-btn flex-col-center gap-xs p-sm radius-md cursor-pointer grow-1 transition-all"
                data-tone={btn.tone}
                role="radio"
                aria-checked={false}
                aria-label={`Tone ${btn.tone}: ${btn.mark}${btn.label}`}
                onClick={() => onSelectTone(btn.tone)}
                type="button"
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = e.currentTarget.parentElement?.children[
                      index + 1
                    ] as HTMLElement | null;
                    next?.focus();
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = e.currentTarget.parentElement?.children[
                      index - 1
                    ] as HTMLElement | null;
                    prev?.focus();
                  }
                }}
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
