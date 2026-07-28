/**
 * @file SentenceDisplay.tsx
 * @description Renders one sentence with Chinese text and pinyin below.
 * Each word is tappable — unknown words are highlighted to indicate clickability.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Only popover position flows through onPopoverOpen prop.
 * The "Open in Word Hub" button inside WordPopover handles hub navigation.
 */
import { memo } from "react";
import { Button } from "shared/components";
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
  return (
    <div
      className="sentence-display transition-all flex-col gap-xs py-sm"
      role="group"
      aria-label={`Sentence ${sentence.index + 1}`}
    >
      {/* Chinese text with tappable words */}
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
            <SentenceWord key={`${word.glyph}-${idx}`} word={word} onPopoverOpen={onPopoverOpen} />
          );
        })}
      </div>

      {/* Pinyin */}
      <div className="sentence-display__pinyin font-sm text-tertiary lh-1-4" aria-label="Pinyin">
        {sentence.pinyin}
      </div>
    </div>
  );
});
