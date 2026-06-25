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
import "./CombinationDisplay.css";

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
      <div className="pinyin-combination-empty p-lg bg-surface-dark-alt border-default radius-md text-tertiary text-center">
        <p>
          No valid combination for{" "}
          <strong className="text-secondary">
            {initial}+{final}
          </strong>
        </p>
      </div>
    );
  }

  return (
    <div className="pinyin-combination-display p-md bg-surface-dark-alt border-default radius-md flex-col gap-sm">
      <h3 className="pinyin-combination-heading font-md text-secondary fw-600 text-center m-0">
        {initial} + {final}
      </h3>
      <div
        className="pinyin-combination-row flex gap-sm flex-wrap flex-center mx-auto"
        style={{ maxWidth: 450 }}
      >
        {tones.filter(Boolean).map((pinyin, index) => (
          <div key={pinyin} className="flex-col-center gap-xs">
            <span className="pinyin-tone-label font-xs text-uppercase text-muted">
              {TONE_LABELS[index] ?? index}
            </span>
            <ToneCell pinyin={pinyin} isLoading={loadingPinyin === pinyin} onPlay={onPlayTone} />
          </div>
        ))}
      </div>
    </div>
  );
}
