/**
 * ReviewComplete.tsx
 * Phase 1 Review — Completion summary screen (wireframe Section 7.7).
 * Shows session stats: pinyin accuracy, tone accuracy, rating breakdown, retention rate.
 */
import type { ReviewSessionResult } from "../types";
import "./ReviewComplete.css";

interface ReviewCompleteProps {
  result: ReviewSessionResult;
  totalItems: number;
  onReviewAgain: () => void;
  onBack: () => void;
}

export function ReviewComplete({ result, totalItems, onReviewAgain, onBack }: ReviewCompleteProps) {
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
      <span className="review-complete__emoji">{"\uD83C\uDF89"}</span>
      <h2 className="review-complete__title text-primary m-0">Review Complete!</h2>
      <p className="review-complete__subtitle text-muted text-center m-0">
        You reviewed {totalItems} character{totalItems !== 1 ? "s" : ""}.
      </p>

      {/* Pinyin accuracy */}
      <div className="review-complete__stat-card card-dark w-full flex-col gap-sm p-lg">
        <div className="flex-between">
          <span className="text-secondary">Pinyin accuracy</span>
          <span className={pinyinPct >= 70 ? "text-success fw-600" : "text-warning fw-600"}>
            {result.pinyinCorrect}/{result.pinyinTotal} ({pinyinPct}%)
          </span>
        </div>

        <div className="flex-between">
          <span className="text-secondary">Tone accuracy</span>
          <span className={tonePct >= 70 ? "text-success fw-600" : "text-warning fw-600"}>
            {result.toneCorrect}/{result.toneTotal} ({tonePct}%)
          </span>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="review-complete__stat-card card-dark w-full flex-col gap-sm p-lg">
        <h3 className="text-primary fw-600 font-md m-0">Self-Ratings</h3>

        <div className="flex-between">
          <span className="text-secondary">{"\uD83D\uDFE2"} Easy:</span>
          <span className="text-success fw-600">
            {result.ratings.easy} (
            {totalRatings > 0 ? Math.round((result.ratings.easy / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <div className="flex-between">
          <span className="text-secondary">{"\uD83D\uDFE1"} Good:</span>
          <span className="text-warning fw-600">
            {result.ratings.good} (
            {totalRatings > 0 ? Math.round((result.ratings.good / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <div className="flex-between">
          <span className="text-secondary">{"\uD83D\uDD34"} Again:</span>
          <span className="text-error fw-600">
            {result.ratings.again} (
            {totalRatings > 0 ? Math.round((result.ratings.again / totalRatings) * 100) : 0}%)
          </span>
        </div>

        <div className="review-complete__divider" />

        <div className="flex-between">
          <span className="text-primary fw-600">Retention rate (Good/Easy)</span>
          <span className={retentionPct >= 70 ? "text-success fw-700" : "text-warning fw-700"}>
            {retentionPct}%
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-center gap-md flex-wrap">
        <button className="btn-primary" onClick={onReviewAgain} type="button">
          {"\uD83D\uDD04"} Review Again
        </button>
        <button className="card-dark-hover hover-lift fw-600" onClick={onBack} type="button">
          {"\uD83D\uDCCB"} Back to Practices
        </button>
      </div>
    </div>
  );
}
