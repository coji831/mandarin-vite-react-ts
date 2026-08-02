/**
 * @file ReviewCardResult.tsx
 * @description Step 3 review card — character + meaning + correct answer + rating
 * Shows correctness feedback using the active review strategy's feedback label.
 */

import React from "react";
import { Box, Button } from "shared/components";
import { openHub } from "shared/store";
import { getReviewStrategy } from "../engine/strategies";
import type { Rating, ReviewItem } from "../types";
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
    <Box variant="dark" padding="md" className="review-card flex-col w-full">
      <div className="review-card__side flex-col-center gap-lg p-xl w-full">
        <div className="review-card__character-display flex-col-center gap-sm">
          <button
            type="button"
            className="review-card__character review-card__character-btn font-5xl lh-tight tracking-wide text-primary fw-700"
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
          {item.meaning && (
            <span className="review-card__meaning text-secondary fw-500 font-md">
              ({item.meaning})
            </span>
          )}
          <span className="review-card__full-answer fw-600 font-2xl text-center">
            {correctPinyin}
          </span>
        </div>

        {/* Per-step correctness — uses the active review strategy's feedback label */}
        <div className="review-card__feedback flex-col gap-sm w-full p-md">
          {(() => {
            const strategy = getReviewStrategy(item.itemType);
            const label = strategy?.feedbackLabel ?? "Answer";
            const isCorrect = strategy?.initialStep === "tone" ? toneCorrect : pinyinCorrect;
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
              <Button
                key={r.value}
                variant={
                  r.value === "again"
                    ? "rating-again"
                    : r.value === "good"
                      ? "rating-good"
                      : "rating-easy"
                }
                data-rating={r.value}
                className="review-card__rating-btn flex-1"
                onClick={() => onRate(r.value)}
              >
                <span className="font-lg">
                  {r.emoji} {r.label}
                </span>
                <span className="font-sm fw-400 op-80">{r.desc}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Box>
  );
}

export const ReviewCardResult = React.memo(ReviewCardResultComponent);
