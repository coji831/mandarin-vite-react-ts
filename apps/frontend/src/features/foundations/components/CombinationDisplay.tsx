/**
 * @file components/CombinationDisplay.tsx
 * @description Tone row display for a selected initial+final combination
 * Story 18.2: Pinyin System Guide
 *
 * Shows 5 tone cells horizontally (tone 1-4 + neutral) when
 * both an initial and final are selected. Each cell is tone-colored
 * and has a play button.
 */

import { ToneCell } from "./ToneCell";

export interface CombinationDisplayProps {
  initial: string;
  final: string;
  tones: string[];
  onPlayTone: (pinyin: string) => void;
  loadingPinyin?: string | null;
}

const TONE_LABELS = ["1st", "2nd", "3rd", "4th", "Neutral"];

export function CombinationDisplay({
  initial,
  final,
  tones,
  onPlayTone,
  loadingPinyin,
}: CombinationDisplayProps) {
  if (tones.length === 0) {
    return (
      <div className="pinyin-combination-empty">
        <p>
          No valid combination for{" "}
          <strong>
            {initial}+{final}
          </strong>
        </p>
      </div>
    );
  }

  return (
    <div className="pinyin-combination-display">
      <h3 className="pinyin-combination-heading">
        {initial} + {final}
      </h3>
      <div className="pinyin-combination-row">
        {tones.map((pinyin, index) => (
          <div key={pinyin} className="pinyin-tone-wrapper">
            <span className="pinyin-tone-label">{TONE_LABELS[index] ?? index}</span>
            <ToneCell pinyin={pinyin} isLoading={loadingPinyin === pinyin} onPlay={onPlayTone} />
          </div>
        ))}
      </div>
    </div>
  );
}
