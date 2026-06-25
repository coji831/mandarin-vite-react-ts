/**
 * @file ReviewCardResult.tsx
 * @description Step 3 review card — character + meaning + correct answer + rating
 * Shows correctness feedback using the active review strategy's feedback label.
 */

import React from "react";
import type { ReviewItem, Rating } from "../types";
import { getReviewStrategy } from "../engine/strategies";
import "./ReviewCard.css";

type ReviewCardResultProps = {
  item: ReviewItem;
  pinyinCorrect: boolean;
  toneCorrect: boolean;
  onRate: (rating: Rating) => void;
};

const RATINGS: { value: Rating; emoji: string; label: string; desc: string }[] = [
  { value: "again", emoji: "\uD83D\uDD34", label: "Again", desc: "Reset 1d" },
  { value: "good", emoji: "\uD83D\uDFE1", label: "Good", desc: "\u00D72" },
  { value: "easy", emoji: "\uD83D\uDFE2", label: "Easy", desc: "\u00D73" },
];

function ReviewCardResultComponent({
  item,
  pinyinCorrect,
  toneCorrect,
  onRate,
}: ReviewCardResultProps) {
  const displayChar = item.character ?? item.front;
  const correctPinyin = item.front;

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
          <span className="review-card__full-answer fw-600 font-2xl">{correctPinyin}</span>
        </div>

        {/* Per-step correctness — uses the active review strategy's feedback label */}
        <div className="review-card__feedback flex-col gap-sm w-full">
          {(() => {
            const strategy = getReviewStrategy(item.itemType);
            const label = strategy?.feedbackLabel ?? "Answer";
            const isCorrect = label === "Pinyin" ? pinyinCorrect : toneCorrect;
            return (
              <div className="flex-between">
                <span className="text-secondary">{label}:</span>
                <span className={isCorrect ? "text-success fw-600" : "text-error fw-600"}>
                  {isCorrect ? "\u2705 Correct" : "\u274C Incorrect"}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Rating buttons */}
        <div className="flex-col-center gap-md w-full">
          <label className="text-secondary fw-500 font-sm">How well did you know it?</label>
          <div className="review-card__ratings flex-center gap-md flex-wrap">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                className="review-card__rating-btn flex-col-center gap-xs p-md radius-md fw-700 transition-all cursor-pointer"
                data-rating={r.value}
                onClick={() => onRate(r.value)}
                type="button"
              >
                <span className="font-lg">
                  {r.emoji} {r.label}
                </span>
                <span className="font-sm fw-400 op-80">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ReviewCardResult = React.memo(ReviewCardResultComponent);
