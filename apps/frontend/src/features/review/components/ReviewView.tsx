/**
 * ReviewView.tsx
 * Phase 1 Review — Main orchestrator component.
 * Renders header, ReviewCard (3-sided flip card), and progress bar.
 * Supports presetType/presetSource props to skip the picker via URL params.
 */
import { useCallback, useEffect } from "react";
import { useReview } from "../hooks/useReview";
import type { ReviewSource } from "../types";
import { useAudioPlayback } from "../../../shared/hooks/useAudioPlayback";
import "./ReviewView.css";
import { ReviewPicker } from "./ReviewPicker";
import { ReviewCard } from "./ReviewCard";
import { ReviewComplete } from "./ReviewComplete";
import { ErrorScreen, LoadingScreen } from "shared/components";

type ReviewViewProps = {
  onBack: () => void;
  presetType?: string | null;
  presetSource?: string | null;
};

export function ReviewView({ onBack, presetType, presetSource }: ReviewViewProps) {
  const {
    step,
    currentItem,
    loading,
    error,
    startReview,
    submitPinyin,
    selectOption,
    selectTone,
    rateItem,
    progress,
    userPinyin,
    pinyinCorrect,
    toneCorrect,
    sessionResult,
    totalItems,
    contentType,
    source,
  } = useReview();

  const { playWordAudio } = useAudioPlayback();

  const handlePlayAudio = useCallback(
    (text: string) => {
      playWordAudio({ chinese: text, fallbackToBrowserTTS: true });
    },
    [playWordAudio],
  );

  // Auto-start review when BOTH presetType AND presetSource are provided
  // (e.g., /practices/review?type=pinyin&filter=due)
  // When only presetType is provided, the picker pre-selects the type without auto-starting.
  useEffect(() => {
    if (presetType && presetSource && step === "pick") {
      startReview(presetSource as ReviewSource, presetType);
    }
  }, [presetType, presetSource, step, startReview]);

  if (loading) {
    return <LoadingScreen message="Loading review items..." />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={() => startReview(source, contentType)} />;
  }

  if (step === "complete" && totalItems === 0 && !loading) {
    return (
      <div className="flex-col-center gap-lg p-2xl">
        <h2 className="text-secondary">No items available</h2>
        <p className="text-muted">Try a different content type or source.</p>
        <button
          className="btn-primary"
          onClick={() => startReview(source, contentType)}
          type="button"
        >
          Try Again
        </button>
      </div>
    );
  }

  switch (step) {
    case "pick":
      return <ReviewPicker onStart={startReview} />;

    case "pinyin":
    case "tone":
    case "option":
    case "result":
      return (
        <div className="review-view flex-col gap-lg mx-auto">
          {/* Header */}
          <header className="flex-between">
            <span className="text-secondary fw-600 font-sm">
              {"\uD83C\uDCCF"} Review
              {contentType
                ? ` · ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}s`
                : ""}{" "}
              · {progress.current} of {progress.total}
            </span>
          </header>

          {/* Flip card */}
          <ReviewCard
            item={currentItem!}
            step={step}
            userPinyin={userPinyin}
            pinyinCorrect={pinyinCorrect}
            toneCorrect={toneCorrect}
            onSubmitPinyin={submitPinyin}
            onSelectTone={selectTone}
            onSelectOption={selectOption}
            onRate={rateItem}
            onPlayAudio={handlePlayAudio}
          />

          {/* Progress bar */}
          <div className="flex-col gap-xs">
            <div className="progress-bar w-full">
              <div
                className="progress-fill"
                style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
              />
            </div>
            <span className="text-muted font-sm text-center">
              {progress.current} of {progress.total}
            </span>
          </div>
        </div>
      );

    case "complete":
      return (
        <ReviewComplete
          result={sessionResult}
          totalItems={totalItems}
          onReviewAgain={() => startReview(source, contentType)}
          onBack={onBack}
        />
      );
  }
}
