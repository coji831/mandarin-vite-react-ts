/**
 * @file components/ToneCell.tsx
 * @description Single tone-colored pinyin cell with play button
 * Story 18.2: Pinyin System Guide
 *
 * Displays a single pinyin syllable with tone color applied to the tone mark.
 * Shows a play button overlay on hover and loading spinner during audio generation.
 */

import { type MouseEvent } from "react";
import { TONE_COLORS, extractToneNumber, getToneVowelIndex } from "../../utils/pinyinUtils";
import "./ToneCell.css";

export interface ToneCellProps {
  pinyin: string;
  isLoading?: boolean;
  loadingText?: string;
  onPlay?: (pinyin: string) => void;
}

/**
 * Split a pinyin string into parts: text before the tone vowel, the tone vowel, and text after.
 * This allows applying color only to the vowel that carries the tone mark.
 */
function splitPinyinAtToneVowel(pinyin: string): {
  before: string;
  vowel: string;
  after: string;
} {
  const idx = getToneVowelIndex(pinyin);
  if (idx === -1) {
    return { before: pinyin, vowel: "", after: "" };
  }
  return {
    before: pinyin.slice(0, idx),
    vowel: pinyin[idx],
    after: pinyin.slice(idx + 1),
  };
}

export function ToneCell({
  pinyin,
  isLoading = false,
  loadingText = "generating...",
  onPlay,
}: ToneCellProps) {
  const toneNumber = extractToneNumber(pinyin);
  const { before, vowel, after } = splitPinyinAtToneVowel(pinyin);
  const toneColor = TONE_COLORS[toneNumber] ?? TONE_COLORS[0];

  const handlePlay = (e: MouseEvent) => {
    e.stopPropagation();
    if (!isLoading) {
      onPlay?.(pinyin);
    }
  };

  return (
    <button
      className="pinyin-tone-cell bg-surface-dark border-default radius-md flex-col-center"
      onClick={handlePlay}
      disabled={isLoading}
      title={isLoading ? "Generating audio..." : `Play ${pinyin}`}
      aria-label={`Play ${pinyin}`}
    >
      <span className="pinyin-tone-cell-text font-lg fw-600">
        {before}
        <span className="pinyin-tone-vowel" style={{ color: toneColor }}>
          {vowel}
        </span>
        {after}
      </span>
      {isLoading && (
        <span className="pinyin-tone-loading font-xs font-italic text-muted">{loadingText}</span>
      )}
    </button>
  );
}
