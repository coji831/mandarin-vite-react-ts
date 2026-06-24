/**
 * ReviewCard.tsx
 * Phase 1 Review — Single flip-card with 3 sides.
 * Manages card-side state internally based on the parent hook's step.
 *
 * Sides:
 *  - "front" (step="pinyin"): character + meaning exposure, audio button, pinyin input
 *  - "back-tone" (step="tone"): character + meaning + typed pinyin + 5 tone buttons
 *  - "back-result" (step="result"): character + meaning + correct pinyin + ✅/❌ + A/G/E rating
 */
import React from "react";
import { useAudioPlayback } from "../../../shared/hooks/useAudioPlayback";
import { ReviewCardFront } from "./ReviewCardFront";
import { ReviewCardBackTone } from "./ReviewCardBackTone";
import { ReviewCardBackResult } from "./ReviewCardBackResult";
import type { ReviewItem, Rating } from "../types";
import "./ReviewCard.css";

type ReviewCardProps = {
  item: ReviewItem;
  step: "pinyin" | "tone" | "result";
  userPinyin: string;
  pinyinCorrect: boolean;
  toneCorrect: boolean;
  onSubmitPinyin: (pinyin: string) => void;
  onSelectTone: (tone: number) => void;
  onRate: (rating: Rating) => void;
  /** Optional external audio handler — falls back to internal useAudioPlayback if omitted */
  onPlayAudio?: (text: string) => void;
};

function ReviewCardComponent({
  item,
  step,
  userPinyin,
  pinyinCorrect,
  toneCorrect,
  onSubmitPinyin,
  onSelectTone,
  onRate,
  onPlayAudio: externalOnPlayAudio,
}: ReviewCardProps) {
  const { playWordAudio } = useAudioPlayback();

  // Use external handler if provided, otherwise fall back to internal
  const handlePlayAudio =
    externalOnPlayAudio ??
    ((text: string) => {
      playWordAudio({ chinese: text, fallbackToBrowserTTS: true });
    });

  if (step === "pinyin") {
    return (
      <ReviewCardFront item={item} onSubmitPinyin={onSubmitPinyin} onPlayAudio={handlePlayAudio} />
    );
  }

  if (step === "tone") {
    return (
      <ReviewCardBackTone
        item={item}
        userPinyin={userPinyin}
        onSelectTone={onSelectTone}
        onPlayAudio={handlePlayAudio}
      />
    );
  }

  if (step === "result") {
    return (
      <ReviewCardBackResult
        item={item}
        userPinyin={userPinyin}
        pinyinCorrect={pinyinCorrect}
        toneCorrect={toneCorrect}
        onRate={onRate}
      />
    );
  }

  return null;
}

export const ReviewCard = React.memo(ReviewCardComponent);
