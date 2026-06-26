/**
 * @file components/ExampleCharCell.tsx
 * @description Single character cell showing glyph, pinyin, meaning, audio play, and hub navigation
 * Story 19.2: Radical Detail Card
 */

import { useHubStore } from "shared/store";
import { useAudioPlayback } from "shared/hooks";

interface ExampleCharCellProps {
  character: string;
  pinyin: string;
  meaning: string;
}

export function ExampleCharCell({ character, pinyin, meaning }: ExampleCharCellProps) {
  const hubOpen = useHubStore((s) => s.open);
  const { playWordAudio } = useAudioPlayback();

  function handleClick() {
    hubOpen(character, pinyin);
  }

  function handleAudioClick(e: React.MouseEvent) {
    e.stopPropagation();
    playWordAudio({ chinese: character, fallbackToBrowserTTS: true });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      className="example-char-cell card-dark flex-col flex-center"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${character} — ${pinyin} — ${meaning}`}
    >
      <span className="example-char-cell__glyph">{character}</span>
      <span className="example-char-cell__pinyin">{pinyin}</span>
      <span className="example-char-cell__meaning">{meaning}</span>
      <button
        className="example-char-cell__audio"
        onClick={handleAudioClick}
        type="button"
        aria-label={`Play audio for ${character}`}
        title={`Listen to ${character}`}
      >
        🔊
      </button>
    </div>
  );
}
