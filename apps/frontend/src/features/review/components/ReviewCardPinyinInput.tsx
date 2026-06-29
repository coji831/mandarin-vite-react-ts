/**
 * @file ReviewCardPinyinInput.tsx
 * @description Step 1 review card — character + meaning exposure, audio button, pinyin input
 *
 * Inner helper component extracted from ReviewCard.
 * Manages its own local pinyin input state.
 */

import React, { useEffect, useRef, useState } from "react";
import type { ReviewItem } from "../types";
import "./ReviewCard.css";

type ReviewCardPinyinInputProps = {
  item: ReviewItem;
  onSubmitPinyin: (pinyin: string) => void;
  onPlayAudio: (text: string) => void;
  showMeaning?: boolean;
};

function ReviewCardPinyinInputComponent({
  item,
  onSubmitPinyin,
  onPlayAudio,
  showMeaning = true,
}: ReviewCardPinyinInputProps) {
  const [localPinyin, setLocalPinyin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const displayChar = item.character ?? item.front;
  const inputPlaceholder =
    item.itemType === "radical" ? "Type the meaning..." : "Type pinyin without tone...";

  // Auto-focus pinyin input when item changes (new review card)
  useEffect(() => {
    inputRef.current?.focus();
  }, [item.itemId]);

  return (
    <div className="review-card card-dark flex-col">
      <div className="review-card__side flex-col-center gap-lg p-xl">
        {/* Character + Meaning for exposure */}
        <div className="review-card__character-display flex-col-center gap-md">
          <span className="review-card__character">{displayChar}</span>
          {item.meaning && showMeaning !== false && (
            <span className="review-card__meaning text-secondary fw-500 font-lg">
              ({item.meaning})
            </span>
          )}
        </div>

        {/* Audio + Pinyin input */}
        <div className="flex-col-center gap-md w-full">
          <button
            className="review-card__audio-btn flex-center"
            onClick={() => onPlayAudio(displayChar)}
            aria-label="Play audio"
            type="button"
          >
            {"\uD83D\uDD0A"}
          </button>

          <div className="flex-center gap-sm w-full" style={{ maxWidth: 320 }}>
            <input
              ref={inputRef}
              type="text"
              className="review-card__pinyin-input"
              placeholder={inputPlaceholder}
              value={localPinyin}
              onChange={(e) => setLocalPinyin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && localPinyin.trim()) {
                  onSubmitPinyin(localPinyin.trim());
                  setLocalPinyin("");
                }
              }}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={() => {
                if (localPinyin.trim()) {
                  onSubmitPinyin(localPinyin.trim());
                  setLocalPinyin("");
                }
              }}
              disabled={!localPinyin.trim()}
              type="button"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ReviewCardPinyinInput = React.memo(ReviewCardPinyinInputComponent);
