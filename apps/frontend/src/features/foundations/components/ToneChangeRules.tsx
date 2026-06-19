/**
 * @file components/ToneChangeRules.tsx
 * @description Tone change rule cards: 3rd tone sandhi, 一 changes, 不 changes
 * Story 18.3: Tones Reference & Practice
 *
 * Renders rule cards for Mandarin tone change rules:
 * - 3rd tone sandhi: 3rd+3rd → 2nd+3rd
 * - 一 (yī) tone change: yī→yí before 4th tone, yī→yì before others
 * - 不 (bù) tone change: bù→bú before 4th tone
 *
 * Each card shows the rule description with dictionary vs spoken examples
 * and play buttons for each example.
 */

import { TONE_COLORS, extractToneNumber } from "../utils/pinyinUtils";
import type { ToneRule } from "../types";

export interface ToneChangeRulesProps {
  rules: ToneRule[];
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

/**
 * Extract Chinese character and pinyin from a rule title like "一 (yī) Tone Change".
 * Returns null if no character + pinyin pattern is found (e.g., "3rd Tone Sandhi").
 */
function extractCharacterInfo(title: string): { char: string; pinyin: string } | null {
  const match = title.match(/^(\p{Script=Han}+)\s*\(([^)]+)\)/u);
  if (match) {
    return { char: match[1], pinyin: `(${match[2]})` };
  }
  return null;
}

export function ToneChangeRules({ rules, onPlay, loadingPinyin }: ToneChangeRulesProps) {
  if (rules.length === 0) {
    return (
      <div className="tone-rules-empty">
        <p>No tone change rules available.</p>
      </div>
    );
  }

  return (
    <div className="tone-rules">
      {rules.flatMap((rule) => {
        const charInfo = extractCharacterInfo(rule.title);

        return rule.examples.map((example, idx) => {
          const isLoading = loadingPinyin === example.chinese;

          return (
            <div key={`${rule.id}-${idx}`} className="tone-rule-card">
              {/* 📖 icon */}
              <span className="tone-rule-icon">📖</span>

              {/* Character + pinyin from title (e.g., "一 (yī)") */}
              {charInfo ? (
                <>
                  <span className="tone-rule-character">{charInfo.char}</span>
                  <span className="tone-rule-pinyin-inline">{charInfo.pinyin}</span>
                </>
              ) : (
                <span className="tone-rule-title">{rule.title}</span>
              )}

              {/* → arrow */}
              <span className="tone-rule-arrow">→</span>

              {/* Rule description (e.g., "yí before 4th tone") */}
              <span className="tone-rule-description">{rule.rule}</span>

              {/* Example inline (e.g., "(一个 → yí gè)") */}
              <span className="tone-rule-example-inline">
                ({example.chinese} → <ColorizedPinyin pinyin={example.spoken} />)
              </span>

              {/* Play button */}
              <button
                className="tone-rule-play-btn"
                onClick={() => onPlay(example.chinese)}
                disabled={isLoading}
                title={isLoading ? "Generating audio..." : `Play ${example.chinese}`}
                aria-label={`Play ${example.chinese}`}
              >
                {isLoading ? <span className="tones-loading-spinner" /> : "▶"}
              </button>
            </div>
          );
        });
      })}
    </div>
  );
}
