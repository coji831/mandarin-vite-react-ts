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

import { TONE_COLORS, extractToneNumber } from "../utils/pinyinUtils";
import type { TonePairDrill } from "../types";

export interface TonePairDrillsProps {
  drills: TonePairDrill[];
  onPlay: (pinyin: string) => void;
  loadingPinyin: string | null;
}

/**
 * Apply tone color to each syllable in a pinyin string.
 * Splits on space and wraps each syllable in a styled span.
 */
function ColorizedPinyin({ pinyin }: { pinyin: string }) {
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
      <div className="tone-pair-drills-empty">
        <p>No tone pair drills available.</p>
      </div>
    );
  }

  return (
    <div className="tone-pair-drills">
      {drills.map((drill) => {
        const isLoading = loadingPinyin === drill.spokenPinyin;

        return (
          <div key={drill.id} className="tone-pair-drill-card">
            {/* Rule badge — moved to front (wireframe: "3rd+3rd → 2nd+3rd") */}
            <span className="tone-pair-drill-rule">{drill.rule}</span>

            {/* Chinese characters */}
            <span className="tone-pair-drill-chinese">{drill.chinese}</span>

            {/* Spoken pinyin — primary result */}
            <span className="tone-pair-drill-spoken-primary">
              <ColorizedPinyin pinyin={drill.spokenPinyin} />
            </span>

            {/* Dict/Spoken comparison — compact inline */}
            <span className="tone-pair-drill-comparison">
              <span className="tone-pair-drill-label">Dict:</span>
              <span className="tone-pair-drill-dict">
                <ColorizedPinyin pinyin={drill.dictionaryPinyin} />
              </span>
              <span className="tone-pair-drill-arrow">→</span>
              <span className="tone-pair-drill-label">Spoken:</span>
              <span className="tone-pair-drill-spoken-compact">
                <ColorizedPinyin pinyin={drill.spokenPinyin} />
              </span>
            </span>

            {/* Play button */}
            <button
              className="tone-pair-drill-play-btn"
              onClick={() => onPlay(drill.chinese)}
              disabled={isLoading}
              title={isLoading ? "Generating audio..." : `Play ${drill.chinese}`}
              aria-label={`Play ${drill.chinese}`}
            >
              {isLoading ? <span className="tones-loading-spinner" /> : "▶"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
