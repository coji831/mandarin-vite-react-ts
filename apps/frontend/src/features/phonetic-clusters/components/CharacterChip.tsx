/**
 * @file components/CharacterChip.tsx
 * @description Clickable character chip showing glyph + pinyin. Opens CharacterHub on click.
 * Story 21.6: Phonetic Clusters
 */

import { useCallback, memo } from "react";
import { openHub } from "shared/store";
import "./CharacterChip.css";

interface CharacterChipProps {
  glyph: string;
  pinyin: string;
  meaning: string;
}

export const CharacterChip = memo(function CharacterChip({
  glyph,
  pinyin,
  meaning,
}: CharacterChipProps) {
  const handleClick = useCallback(() => {
    openHub({ entityType: "character", entityId: glyph, label: pinyin });
  }, [glyph, pinyin]);

  return (
    <button
      type="button"
      className="character-chip gap-xs flex-col items-center p-xs radius-md cursor-pointer border-1 border-surface bg-surface-light-5 transition-colors hover:border-primary-border"
      onClick={handleClick}
      aria-label={`${glyph} — ${pinyin} — ${meaning}`}
      title={`${glyph} (${pinyin}) — ${meaning}`}
    >
      <span className="character-chip__glyph font-xl text-primary lh-1">{glyph}</span>
      <span className="character-chip__pinyin font-xs text-primary-light font-italic lh-1">
        {pinyin}
      </span>
    </button>
  );
});
