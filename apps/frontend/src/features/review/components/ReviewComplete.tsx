/**
 * ReviewComplete.tsx
 * Phase 1 Review — Completion summary screen (wireframe Section 7.7).
 * Shows session stats: pinyin accuracy, tone accuracy, rating breakdown, retention rate.
 *
 * Rework (§1): the guest's persistence ask appears ONCE, here, at completion
 * (BM-1 §5: post-rating) — as the session's single primary CTA. A registered
 * learner sees `Review Again` in that same slot, so the screen has one primary
 * either way. Colour is never the sole indicator of a rating, so the rating rows
 * are labelled in text (the 🔴🟡🟢 glyphs are gone — AI-slop list).
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import type { ReviewSessionResult } from "../types";
import { Box, Button } from "shared/components";
import { practices_page, register_page } from "shared/constants";
import "./ReviewComplete.css";

type ReviewCompleteProps = {
  result: ReviewSessionResult;
  totalItems: number;
  onReviewAgain: () => void;
  onBack: () => void;
  /** Guests can do the session but cannot keep it — the ask lands here. */
  isGuest?: boolean;
};

function ReviewCompleteComponent({
  result,
  totalItems,
  onReviewAgain,
  onBack,
  isGuest = false,
}: ReviewCompleteProps) {
  const navigate = useNavigate();
  const pinyinPct =
    result.pinyinTotal > 0 ? Math.round((result.pinyinCorrect / result.pinyinTotal) * 100) : 0;
  const tonePct =
    result.toneTotal > 0 ? Math.round((result.toneCorrect / result.toneTotal) * 100) : 0;
  const totalRatings = result.ratings.easy + result.ratings.good + result.ratings.again;
  const retentionPct =
    totalRatings > 0
      ? Math.round(((result.ratings.easy + result.ratings.good) / totalRatings) * 100)
      : 0;

  return (
    <div className="review-complete flex-col-center gap-lg mx-auto">
      <span className="review-complete__emoji font-5xl">{"\uD83C\uDF89"}</span>
      <h2 className="review-complete__title text-primary font-3xl fw-700 tracking-tight m-0">
        Review Complete!
      </h2>
      <p className="review-complete__subtitle text-muted text-center font-lg m-0">
        You reviewed {totalItems} item{totalItems !== 1 ? "s" : ""}.
      </p>

      {/* Pinyin accuracy - only shown for pinyin review sessions */}
      {result.pinyinTotal > 0 && (
        <Box
          variant="dark-accent"
          padding="lg"
          className="review-complete__stat-card w-full flex-col gap-sm"
        >
          <div className="flex-between">
            <span className="text-secondary">Pinyin accuracy</span>
            <span className={pinyinPct >= 70 ? "text-success fw-600" : "text-warning fw-600"}>
              {result.pinyinCorrect}/{result.pinyinTotal} ({pinyinPct}%)
            </span>
          </div>

          {/* Tone accuracy - only shown for tone review sessions */}
          {result.toneTotal > 0 && (
            <div className="flex-between">
              <span className="text-secondary">Tone accuracy</span>
              <span className={tonePct >= 70 ? "text-success fw-600" : "text-warning fw-600"}>
                {result.toneCorrect}/{result.toneTotal} ({tonePct}%)
              </span>
            </div>
          )}
        </Box>
      )}

      {/* Rating breakdown */}
      <Box
        variant="dark-accent"
        padding="lg"
        className="review-complete__stat-card w-full flex-col gap-sm"
      >
        <h3 className="text-primary fw-600 font-md m-0">Self-Ratings</h3>

        <div className="flex-between">
          <span className="text-secondary">Easy:</span>
          <span className="text-success fw-600">
            {result.ratings.easy} (
            {totalRatings > 0 ? Math.round((result.ratings.easy / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <div className="flex-between">
          <span className="text-secondary">Good:</span>
          <span className="text-warning fw-600">
            {result.ratings.good} (
            {totalRatings > 0 ? Math.round((result.ratings.good / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <div className="flex-between">
          <span className="text-secondary">Again:</span>
          <span className="text-error fw-600">
            {result.ratings.again} (
            {totalRatings > 0 ? Math.round((result.ratings.again / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <Box variant="divider" className="review-complete__divider" />

        <div className="flex-between">
          <span className="text-primary fw-600">Retention rate (Good/Easy)</span>
          <span className={retentionPct >= 70 ? "text-success fw-700" : "text-warning fw-700"}>
            {retentionPct}%
          </span>
        </div>
      </Box>

      {/* ONE primary: guests get the single persistence ask (BM-1 §5), everyone
          else gets the next session. Back to Practices is the ghost. */}
      <div className="flex-center gap-md flex-wrap">
        {isGuest ? (
          <Button variant="primary" onClick={() => navigate(register_page)}>
            Create an account to keep this queue
          </Button>
        ) : (
          <Button variant="primary" onClick={onReviewAgain}>
            Review Again
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            onBack();
            navigate(practices_page);
          }}
        >
          Back to Practices
        </Button>
      </div>
    </div>
  );
}

export const ReviewComplete = React.memo(ReviewCompleteComponent);
