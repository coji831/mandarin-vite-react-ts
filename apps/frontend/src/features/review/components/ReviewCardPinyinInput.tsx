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
  // Short, unambiguous placeholders: the input is narrow (max-w-320 next to a
  // Submit button) and the old "Type pinyin without tone..." was clipped by the
  // input's letter-spacing (rework-proposal §4).
  const inputPlaceholder = item.itemType === "radical" ? "Type meaning…" : "Type pinyin…";

  // Auto-focus pinyin input when item changes (new review card)
  useEffect(() => {
    inputRef.current?.focus();
  }, [item.itemId]);

  const handleOpenHub = () => {
    openHub({
      entityType: "character",
      entityId: displayChar,
      label: item.plainPinyin ?? item.pinyinPlain ?? item.front,
    });
  };

  return (
    <Box variant="dark" padding="md" className="review-card flex-col w-full">
      <div className="review-card__side flex-col-center gap-md p-xl w-full">
        {/* Character + Meaning for exposure. The glyph is the session's <h1>
            (rework-proposal §4) — the heading wrapper inherits the glyph scale
            so the semantic level and the visual hierarchy agree. */}
        <div className="review-card__character-display flex-col-center gap-md">
          <h1 className="review-card__character-heading m-0">
            <button
              type="button"
              className="review-card__character review-card__character-btn font-5xl lh-1 text-primary fw-700"
              onClick={handleOpenHub}
              aria-label={`View details for ${displayChar}`}
            >
              {displayChar}
            </button>
          </h1>
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
