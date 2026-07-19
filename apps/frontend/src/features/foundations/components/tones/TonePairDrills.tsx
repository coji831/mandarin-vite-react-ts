/**
 * @file components/TonePairDrills.tsx
 * @description Tone pair drill cards with dictionary vs spoken pinyin comparison
 * Story 18.3: Tones Reference & Practice
 *
 * Renders a list of tone pair drill cards showing common 2-syllable combinations.
 * Each card displays:
 * - Chinese characters
 * - Dictionary pinyin vs spoken pinyin (side-by-side)
 * - Rule label (e.g., "3+3")
 * - Play button for pronunciation with sandhi applied
 */

import React from "react";
import { TONE_COLORS, extractToneNumber } from "../../utils/pinyinUtils";
import type { TonePairDrill } from "../../types";
import { Button, Box, Spinner } from "shared/components";
import "./TonePairDrills.css";

export interface TonePairDrillsProps {
  drills: TonePairDrill[];
  onPlay: (pinyin: string) => void;
  loadingPinyin: string | null;
}

/**
 * Apply tone color to each syllable in a pinyin string.
 * Splits on space and wraps each syllable in a styled span.
 */
export function ColorizedPinyin({ pinyin }: { pinyin: string }) {
  const syllables = pinyin.split(/\s+/);

  return (
    <>
      {syllables.map((syllable, idx) => {
        const toneNum = extractToneNumber(syllable);
        const color = TONE_COLORS[toneNum] ?? TONE_COLORS[0];
        return (
          <span key={idx}>
            {idx > 0 && " "}
            <span style={{ color }}>{syllable}</span>
          </span>
        );
      })}
    </>
  );
}

export function TonePairDrills({ drills, onPlay, loadingPinyin }: TonePairDrillsProps) {
  if (drills.length === 0) {
    return (
      <Box
        variant="dark-alt"
        padding="md"
        className="tone-pair-drills-empty font-italic text-muted text-center"
      >
        <p>No tone pair drills available.</p>
      </Box>
    );
  }

  return (
    <Box variant="dark-alt" padding="xs" className="tone-pair-drills">
      {drills.map((drill) => {
        const isLoading = loadingPinyin === drill.spokenPinyin;

        return (
          <div key={drill.id} className="tone-pair-drill-card flex-center gap-xs">
            {/* Rule badge — moved to front (wireframe: "3rd+3rd → 2nd+3rd") */}
            <span className="tone-pair-drill-rule text-muted bg-surface-dark whitespace-nowrap radius-sm">
              {drill.rule}
            </span>

            {/* Chinese characters */}
            <span className="tone-pair-drill-chinese font-sm shrink-0 fw-500 text-primary">
              {drill.chinese}
            </span>

            {/* Spoken pinyin — primary result */}
            <span className="tone-pair-drill-spoken-primary font-sm fw-600">
              <ColorizedPinyin pinyin={drill.spokenPinyin} />
            </span>

            {/* Dict/Spoken comparison — compact inline */}
            <span className="tone-pair-drill-comparison text-tertiary">
              <span className="tone-pair-drill-label text-muted text-uppercase">Dict:</span>
              <span className="tone-pair-drill-dict font-xs line-through op-60 shrink-0">
                <ColorizedPinyin pinyin={drill.dictionaryPinyin} />
              </span>
              <span className="tone-pair-drill-arrow font-xs shrink-0 text-muted">→</span>
              <span className="tone-pair-drill-label text-muted text-uppercase">Spoken:</span>
              <span className="tone-pair-drill-spoken-compact">
                <ColorizedPinyin pinyin={drill.spokenPinyin} />
              </span>
            </span>

            {/* Play button */}
            <Button
              variant="icon"
              onClick={() => onPlay(drill.chinese)}
              disabled={isLoading}
              title={isLoading ? "Generating audio..." : `Play ${drill.chinese}`}
              aria-label={isLoading ? "Generating audio..." : `Play ${drill.chinese}`}
            >
              {isLoading ? <Spinner size="xs" /> : "▶"}
            </Button>
          </div>
        );
      })}
    </Box>
  );
}
