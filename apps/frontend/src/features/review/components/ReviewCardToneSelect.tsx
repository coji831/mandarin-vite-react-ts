/**
 * @file ReviewCardToneSelect.tsx
 * @description Tone selection review card — character + meaning + tone buttons
 * This is the first (and only input) step for tone-syllable items.
 *
 * Shows 5 tone buttons (1st/2nd/3rd/4th/neutral) for the user to select from.
 */

import React from "react";
import type { ReviewItem } from "../types";
import { TONE_BUTTONS_BASE } from "shared/constants";
import { Box, Button, RadioGroup } from "shared/components";
import type { RadioOption } from "shared/components";
import "./ReviewCard.css";

type ReviewCardToneSelectProps = {
  item: ReviewItem;
  onSelectTone: (tone: number) => void;
  onPlayAudio: (text: string) => void;
  showMeaning?: boolean;
};

function ReviewCardToneSelectComponent({
  item,
  onSelectTone,
  onPlayAudio,
  showMeaning = true,
}: ReviewCardToneSelectProps) {
  const displayChar = item.character ?? item.front;

  const toneOptions: RadioOption[] = TONE_BUTTONS_BASE.map((btn) => ({
    value: String(btn.tone),
    label: `${btn.mark}${btn.label}`,
  }));

  return (
    <Box variant="dark" padding="md" className="review-card flex-col w-full">
      <div className="review-card__side flex-col-center gap-lg p-xl w-full">
        <div className="review-card__character-display flex-col-center gap-sm">
          <span className="review-card__character">{displayChar}</span>
          {item.meaning && showMeaning !== false && (
            <span className="review-card__meaning text-secondary fw-500 font-md">
              ({item.meaning})
            </span>
          )}
        </div>

        <div className="flex-center gap-md">
          <Button
            variant="circle"
            className="review-card__audio-btn transition-all"
            onClick={() => onPlayAudio(displayChar)}
            aria-label="Play audio"
          >
            {"\uD83D\uDD0A"}
          </Button>
        </div>

        <div className="flex-col-center gap-md w-full">
          <RadioGroup
            name="tone-select"
            options={toneOptions}
            value={null}
            onChange={(value) => onSelectTone(Number(value))}
            layout="horizontal"
            label="Select the correct tone:"
          />
        </div>
      </div>
    </Box>
  );
}

export const ReviewCardToneSelect = React.memo(ReviewCardToneSelectComponent);
