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
import React, { useEffect, useRef } from "react";
import { useAudioPlayback } from "shared/hooks";
import { ReviewCardPinyinInput } from "./ReviewCardPinyinInput";
import { ReviewCardToneSelect } from "./ReviewCardToneSelect";
import { ReviewCardOptionSelect } from "./ReviewCardOptionSelect";
import { ReviewCardResult } from "./ReviewCardResult";
import { getReviewStrategy } from "../engine/strategies";
import type { ReviewItem, Rating } from "../types";
import "./ReviewCard.css";

type ReviewCardProps = {
  item: ReviewItem;
  step: "pinyin" | "tone" | "option" | "result";
  userPinyin: string;
  pinyinCorrect: boolean;
  toneCorrect: boolean;
  onSubmitPinyin: (pinyin: string) => void;
  onSelectTone: (tone: number) => void;
  onSelectOption?: (optionId: string) => void;
  onRate: (rating: Rating) => void;
  /** Optional external audio handler — falls back to internal useAudioPlayback if omitted */
  onPlayAudio?: (text: string) => void;
};

function ReviewCardComponent({
  item,
  step,
  userPinyin: _userPinyin,
  pinyinCorrect,
  toneCorrect,
  onSubmitPinyin,
  onSelectTone,
  onSelectOption,
  onRate,
  onPlayAudio: externalOnPlayAudio,
}: ReviewCardProps) {
  const { playWordAudio } = useAudioPlayback();
  const hasUserInteracted = useRef(false);

  // Use external handler if provided, otherwise fall back to internal
  const handlePlayAudio =
    externalOnPlayAudio ??
    ((text: string) => {
      hasUserInteracted.current = true;
      playWordAudio({ chinese: text, fallbackToBrowserTTS: true });
    });

  // Auto-play audio when step changes (after first user gesture enables browser autoplay)
  useEffect(() => {
    if (hasUserInteracted.current && item) {
      const displayChar = item.character ?? item.front;
      playWordAudio({ chinese: displayChar, fallbackToBrowserTTS: true });
    }
  }, [step, item?.itemId, playWordAudio, item]);

  if (step === "pinyin") {
    const strategy = getReviewStrategy(item.itemType);
    return (
      <ReviewCardPinyinInput
        item={item}
        onSubmitPinyin={onSubmitPinyin}
        onPlayAudio={handlePlayAudio}
        showMeaning={strategy?.showMeaning ?? true}
      />
    );
  }

  if (step === "tone") {
    const strategy = getReviewStrategy(item.itemType);
    return (
      <ReviewCardToneSelect
        item={item}
        onSelectTone={onSelectTone}
        onPlayAudio={handlePlayAudio}
        showMeaning={strategy?.showMeaning ?? true}
      />
    );
  }

  if (step === "option") {
    return (
      <ReviewCardOptionSelect
        item={item}
        onSelectOption={onSelectOption ?? (() => {})}
        onPlayAudio={handlePlayAudio}
      />
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
