/**
 * @file SentenceDisplay.tsx
 * @description Renders one sentence with Chinese text and pinyin below.
 * Each word is tappable — unknown words are highlighted to indicate clickability.
 * Phase 2: Audio cursor read from audioStore directly — no audio props.
 * VisFix: Per-sentence audio button replaces container tap-to-play — word taps
 *   only open the popover and never trigger audio.
 *
 * Only popover position flows through onPopoverOpen prop.
 * The "Open in Word Hub" button inside WordPopover handles hub navigation.
 * The per-sentence play button sets pendingSingleIndex in audioStore for
 * useAudioPlayer to consume (single-sentence play — no auto-advance).
 */
import { memo, useCallback } from "react";
import { Button } from "shared/components";
import { useAudioStore } from "../stores";
import "./SentenceDisplay.css";

export type SentenceWord = {
  glyph: string;
  isKnown: boolean;
  hskLevel?: number;
  pinyin?: string;
};

export type SentenceData = {
  index: number;
  text: string;
  pinyin: string;
  words: SentenceWord[];
};

export type SentenceDisplayProps = {
  sentence: SentenceData;
  onPopoverOpen: (glyph: string, rect: DOMRect) => void;
};

/** Punctuation characters set for fast lookup */
const PUNCTUATION_SET = new Set([
  // Chinese
  "。",
  "，",
  "、",
  "？",
  "！",
  "；",
  "：",
  "“",
  "”",
  "‘",
  "’",
  "（",
  "）",
  "【",
  "】",
  "《",
  "》",
  "—",
  "…",
  "·",
  "～",
  // English
  ".",
  ",",
  "?",
  "!",
  ";",
  ":",
  '"',
  "'",
  "(",
  ")",
  "[",
  "]",
  "{",
  "}",
  "-",
  "_",
  "#",
  "@",
  "$",
  "%",
  "^",
  "&",
  "*",
  "+",
  "=",
  "|",
  "\\",
  "/",
  "<",
  ">",
  // Whitespace
  " ",
  "\t",
  "\n",
]);

function isPunctuation(glyph: string): boolean {
  for (const char of glyph) {
    if (!PUNCTUATION_SET.has(char)) return false;
  }
  return glyph.length > 0;
}

function SentenceWord({
  word,
  onPopoverOpen,
}: {
  word: SentenceWord;
  onPopoverOpen: (glyph: string, rect: DOMRect) => void;
}) {
  return word.isKnown ? (
    <span
      className="sentence-word sentence-word--known text-primary"
      aria-label={`${word.glyph} (known)`}
    >
      {word.glyph}
    </span>
  ) : (
    <Button
      variant="inline-text"
      className="sentence-word sentence-word--unknown"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Open popover at tap position
        onPopoverOpen(word.glyph, rect);
      }}
      aria-label={`${word.glyph} (unknown — tap for details)`}
      title="Tap for word details"
    >
      {word.glyph}
    </Button>
  );
}

export const SentenceDisplay = memo(function SentenceDisplay({
  sentence,
  onPopoverOpen,
}: SentenceDisplayProps) {
  // Note: Raw <div> is intentional here. No Box variant matches the visual
  // contract of SentenceDisplay (no default bg/border, single-sided active border).
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const status = useAudioStore((s) => s.status);
  const setPendingSingleIndex = useAudioStore((s) => s.setPendingSingleIndex);
  const isActive = currentIndex === sentence.index;
  const handlePlay = useCallback(() => {
    setPendingSingleIndex(sentence.index);
  }, [setPendingSingleIndex, sentence.index]);

  const sentenceNumber = sentence.index + 1;
  const isLoadingThis = isActive && status === "loading";
  const isPlayingThis = isActive && status === "playing";
  const playIcon = isLoadingThis ? "⏳" : isPlayingThis ? "⏸" : "🔊";

  const containerClass = [
    "sentence-display",
    "transition-all",
    "flex-col",
    "gap-xs",
    "py-sm",
    isActive ? "sentence-display--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass} aria-current={isActive ? "step" : undefined}>
      <div className="sentence-display__row flex-align-center gap-sm">
        {/* Chinese text with tappable words + pinyin */}
        <div className="sentence-display__body flex-col gap-xs flex-1">
          <div className="sentence-display__text font-xl lh-normal">
            {sentence.words.map((word, idx) => {
              // Punctuation renders as plain text — never tappable
              if (isPunctuation(word.glyph)) {
                return (
                  <span
                    key={`${word.glyph}-${idx}`}
                    className="sentence-word sentence-word--punct text-primary"
                  >
                    {word.glyph}
                  </span>
                );
              }

              return (
                <SentenceWord
                  key={`${word.glyph}-${idx}`}
                  word={word}
                  onPopoverOpen={onPopoverOpen}
                />
              );
            })}
          </div>

          {/* Pinyin */}
          <div
            className="sentence-display__pinyin font-sm text-tertiary lh-1-4"
            aria-label="Pinyin"
          >
            {sentence.pinyin}
          </div>
        </div>

        {/* Per-sentence audio button */}
        <Button
          variant={isActive ? "control-active" : "ghost"}
          size="sm"
          onClick={handlePlay}
          aria-label={
            isActive ? `Replay sentence ${sentenceNumber}` : `Play sentence ${sentenceNumber}`
          }
          className="sentence-display__play-btn shrink-0"
        >
          {playIcon}
        </Button>
      </div>
    </div>
  );
});
