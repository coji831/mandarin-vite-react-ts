/**
 * @file ReviewCardBackTone.tsx
 * @description Step 2 review card — character + meaning + typed pinyin + tone selection
 *
 * Inner helper component extracted from ReviewCard.
 * Shows the user's typed pinyin and 5 tone buttons for selection.
 */

import React from "react";
import type { ReviewItem } from "../types";
import "./ReviewCard.css";

interface ReviewCardBackToneProps {
  item: ReviewItem;
  userPinyin: string;
  onSelectTone: (tone: number) => void;
  onPlayAudio: (text: string) => void;
}

/** Tone button configuration matching the PinyinToneInput color scheme. */
const TONE_BUTTONS = [
  { tone: 1, mark: "\u02C9", label: "1st", color: "#FF4444" },
  { tone: 2, mark: "\u02CA", label: "2nd", color: "#FF8C00" },
  { tone: 3, mark: "\u02C7", label: "3rd", color: "#4CAF50" },
  { tone: 4, mark: "\u02CB", label: "4th", color: "#2196F3" },
  { tone: 0, mark: "\u00B7", label: "0", color: "#9E9E9E" },
];

function ReviewCardBackToneComponent({
  item,
  userPinyin,
  onSelectTone,
  onPlayAudio,
}: ReviewCardBackToneProps) {
  const displayChar = item.character ?? item.front;

  return (
    <div className="review-card card-dark flex-col">
      <div className="review-card__side flex-col-center gap-lg p-xl">
        <div className="review-card__character-display flex-col-center gap-sm">
          <span className="review-card__character">{displayChar}</span>
          {item.meaning && (
            <span className="review-card__meaning text-secondary fw-500 font-md">
              ({item.meaning})
            </span>
          )}
          <span className="review-card__pinyin-hint text-primary fw-600 font-2xl">
            {userPinyin}
          </span>
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
            {TONE_BUTTONS.map((btn) => (
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

export const ReviewCardBackTone = React.memo(ReviewCardBackToneComponent);
