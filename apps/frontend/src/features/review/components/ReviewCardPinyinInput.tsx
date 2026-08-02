/**
 * @file ReviewCardPinyinInput.tsx
 * @description Step 1 review card — character + meaning exposure, audio button, pinyin input
 *
 * Inner helper component extracted from ReviewCard.
 * Manages its own local pinyin input state.
 */

import React, { useEffect, useRef, useState } from "react";
import type { ReviewItem } from "../types";
import { openHub } from "shared/store";
import { Box, Button, Input } from "shared/components";
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

  const handleOpenHub = () => {
    openHub({
      entityType: "character",
      entityId: displayChar,
      label: item.pinyinPlain ?? item.front,
    });
  };

  return (
    <Box variant="dark" padding="md" className="review-card flex-col w-full">
      <div className="review-card__side flex-col-center gap-lg p-xl w-full">
        {/* Character + Meaning for exposure */}
        <div className="review-card__character-display flex-col-center gap-md">
          <button
            type="button"
            className="review-card__character review-card__character-btn font-5xl lh-tight tracking-wide text-primary fw-700"
            onClick={handleOpenHub}
            aria-label={`View details for ${displayChar}`}
          >
            {displayChar}
          </button>
          {item.meaning && showMeaning !== false && (
            <span className="review-card__meaning text-secondary fw-500 font-lg text-center">
              ({item.meaning})
            </span>
          )}
        </div>

        {/* Audio + Pinyin input */}
        <div className="flex-col-center gap-md w-full">
          <Button
            variant="circle"
            className="review-card__audio-btn bg-surface-dark"
            onClick={() => onPlayAudio(displayChar)}
            aria-label="Play audio"
          >
            {"\uD83D\uDD0A"}
          </Button>

          <div className="flex-center gap-sm w-full max-w-320">
            <Input
              ref={inputRef}
              className="review-card__pinyin-input text-center bg-surface-dark-alt flex-1"
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
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (localPinyin.trim()) {
                  onSubmitPinyin(localPinyin.trim());
                  setLocalPinyin("");
                }
              }}
              disabled={!localPinyin.trim()}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </Box>
  );
}

export const ReviewCardPinyinInput = React.memo(ReviewCardPinyinInputComponent);
