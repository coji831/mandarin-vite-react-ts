/**
 * ReviewCard.tsx
 * Phase 1 Review — Step-based review card container.
 * Renders the appropriate step component based on the parent hook's step.
 * Step flow is determined by the active ReviewStrategy.
 *
 * Steps:
 *  - "pinyin" (step="pinyin"): character + meaning exposure, audio button, pinyin input → ReviewCardPinyinInput
 *  - "tone" (step="tone"): character + meaning + tone selection → ReviewCardToneSelect
 *  - "result" (step="result"): character + meaning + correct answer + ✅/❌ + A/G/E rating → ReviewCardResult
 */
import React from "react";
import { useAudioPlayback } from "../../../shared/hooks/useAudioPlayback";
import { ReviewCardPinyinInput } from "./ReviewCardPinyinInput";
import { ReviewCardToneSelect } from "./ReviewCardToneSelect";
import { ReviewCardResult } from "./ReviewCardResult";
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
      <ReviewCardPinyinInput
        item={item}
        onSubmitPinyin={onSubmitPinyin}
        onPlayAudio={handlePlayAudio}
      />
    );
  }

  if (step === "tone") {
    return (
      <ReviewCardToneSelect item={item} onSelectTone={onSelectTone} onPlayAudio={handlePlayAudio} />
    );
  }

  if (step === "result") {
    return (
      <ReviewCardResult
        item={item}
        pinyinCorrect={pinyinCorrect}
        toneCorrect={toneCorrect}
        onRate={onRate}
      />
    );
  }

  return null;
}

export const ReviewCard = React.memo(ReviewCardComponent);
