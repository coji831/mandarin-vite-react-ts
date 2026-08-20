/**
 * @file components/pinyin/DetailPanel.tsx
 * @description Detail panel shown on the right when a pinyin grid cell is selected.
 * Shows pinyin, tone options, character link, meaning, and play button.
 */

import { useState } from "react";

import {
  applyToneMark,
  extractToneNumber,
  normalizePinyinForComparison,
  resolveHanzi,
  stripToneAndDigits,
} from "@mandarin/shared-utils";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import { Box, Button, ButtonVariant, Icon } from "shared/components";
import { useAudioItemPlayback } from "shared/hooks";
import { openHub } from "shared/store";
import { TONE_COLORS } from "../../utils/pinyinUtils";
import "./DetailPanel.css";

// ─── Constants ───

/**
 * Convert ANY pinyin format (tone-number "ba1", marked "bā", plain "ba") to its
 * tone-marked display form ("bā"). Neutral/no-tone input stays plain.
 * Used for the big display span and the character-link label so the panel
 * never shows raw tone numbers like "bai1".
 */
function toToneMarked(pinyin: string): string {
  return applyToneMark(stripToneAndDigits(pinyin), extractToneNumber(pinyin));
}

const TONE_MARKS: Record<number, string> = {
  1: "\u02C9", // Macron ˉ
  2: "\u02CA", // Acute ˊ
  3: "\u02C7", // Caron ˇ
  4: "\u02CB", // Grave ˋ
  0: "\u25CB", // Circle ◌
};

const TONE_VARIANTS: Record<number, string> = {
  1: "tone-1",
  2: "tone-2",
  3: "tone-3",
  4: "tone-4",
  0: "tone-5",
};

const TONE_LABELS: Record<number, string> = {
  1: "T1",
  2: "T2",
  3: "T3",
  4: "T4",
  0: "T0",
};

const EXAMPLE_WORDS: Record<string, string> = {
  bā: "eight",
  bá: "to pull",
  bǎ: "to hold",
  bà: "dad",
  ba: "(particle)",
  pō: "slope",
  pò: "broken",
  mā: "mom",
  má: "hemp",
  mǎ: "horse",
  mà: "to scold",
  dà: "big",
  tā: "he/him",
  nǐ: "you",
  lì: "strength",
  gē: "brother",
  kě: "can/may",
  hǎo: "good",
  jī: "chicken",
  qī: "seven",
  xī: "west",
  zhī: "to know",
  chī: "to eat",
  shí: "ten",
  shì: "to be",
  rì: "sun/day",
  rén: "person",
};

// ─── Props ───

interface DetailPanelProps {
  initial: string;
  final: string;
  tones: string[];
  charMap?: PinyinCharacterMap | null;
  onClose: () => void;
}

// ─── Component ───

export function DetailPanel({ initial, final, tones, charMap, onClose }: DetailPanelProps) {
  const defaultTone = tones[0] ?? "";
  const [activeTone, setActiveTone] = useState(defaultTone);
  const { play } = useAudioItemPlayback();
  const toneNum = extractToneNumber(activeTone);
  const toneColor = TONE_COLORS[toneNum] ?? TONE_COLORS[0];
  // Display form: always tone-marked ("bai1" → "bāi"), never raw tone numbers.
  const displayPinyin = toToneMarked(activeTone);

  // Phase 1b universalization: resolve ANY pinyin format ("ba1" / "bā" / "ba")
  // to a Hanzi glyph via the canonical resolver (idempotent for Hanzi input).
  const chineseChar = resolveHanzi(activeTone, charMap) ?? "";
  // EXAMPLE_WORDS is keyed by marked/plain pinyin — normalize tone-number forms
  // ("ba1" → "ba") for the meaning lookup only.
  const plainPinyin = normalizePinyinForComparison(activeTone);
  const meaning = EXAMPLE_WORDS[activeTone] ?? EXAMPLE_WORDS[plainPinyin] ?? "";

  return (
    <Box
      variant="dark"
      padding="md"
      className="pinyin-detail-panel animate-fade-in flex-col shrink-0 self-start"
    >
      {/* Header */}
      <div className="pinyin-detail-header flex-between p-sm">
        <span className="font-md fw-700 text-secondary">
          {initial} + {final}
        </span>
        <Button variant="icon" onClick={onClose} aria-label="Close">
          ×
        </Button>
      </div>

      {/* Divider */}
      <Box variant="divider" />

      {/* Main content — fills remaining space, centered */}
      <div className="pinyin-detail-main flex-col-center gap-sm flex-1 p-0">
        <span className="font-3xl fw-700" style={{ color: toneColor }}>
          {/* inline: dynamic tone color — toneColor is computed at render time */}
          {displayPinyin}
        </span>

        <div className="flex-center gap-sm">
          {chineseChar ? (
            <Button
              variant="ghost-primary"
              className="pinyin-detail-char-link gap-4px p-xs"
              onClick={() =>
                openHub({
                  entityType: "character",
                  entityId: chineseChar,
                  label: displayPinyin,
                })
              }
              title="View character details"
            >
              <span className="font-2xl text-primary">{chineseChar}</span>
              <span className="flex-center">
                <Icon name="search" size={16} aria-hidden />
              </span>
            </Button>
          ) : (
            <span className="font-xs text-muted">&mdash;</span>
          )}
        </div>

        {meaning && <span className="font-sm text-muted">({meaning})</span>}
      </div>

      {/* Tone chips */}
      <div className="pinyin-detail-tones flex-center gap-xs shrink-0">
        {[1, 2, 3, 4, 0].map((toneNum) => {
          const toneIdx = toneNum === 0 ? 4 : toneNum - 1;
          const pinyin = tones[toneIdx];
          if (!pinyin) return null;
          const isActive = pinyin === activeTone;
          return (
            <Button
              key={toneNum}
              variant={TONE_VARIANTS[toneNum] as ButtonVariant}
              size="sm"
              className={`pinyin-detail-tone-chip flex-col-center radius-sm p-xs transition-all ${isActive ? "fw-600" : ""}`}
              onClick={() => {
                setActiveTone(pinyin);
              }}
              title={`Tone ${toneNum} — ${TONE_LABELS[toneNum]}`}
            >
              <span className="font-xs fw-600">{toneNum === 0 ? "0" : String(toneNum)}</span>
              <span className="font-xs">{TONE_MARKS[toneNum]}</span>
            </Button>
          );
        })}
      </div>

      {/* Play audio button */}
      <div className="pinyin-detail-actions flex-center shrink-0 p-md">
        <Button
          variant="primary"
          className="gap-sm"
          disabled={!chineseChar}
          title={chineseChar ? undefined : "No character available for this syllable"}
          onClick={() => play(chineseChar)}
        >
          🔊 <span>Play</span>
        </Button>
      </div>
    </Box>
  );
}
