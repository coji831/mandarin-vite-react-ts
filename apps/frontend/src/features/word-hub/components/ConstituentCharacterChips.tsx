import { openHub } from "shared/store";

/**
 * @file ConstituentCharacterChips.tsx
 * @description Renders clickable chips for characters that make up a word.
 * Extracted from WordHubContent for reuse.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */
interface ConstituentCharacterChipsProps {
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function ConstituentCharacterChips({ characters }: ConstituentCharacterChipsProps) {
  if (!characters || characters.length === 0) return null;
  const handleCharacterClick = (charGlyph: string) => {
    openHub({ entityType: "character", entityId: charGlyph });
  };
  return (
    <div className="flex-col gap-sm">
      <span className="font-sm text-tertiary fw-600">Characters in this word</span>
      <div className="flex-row flex-wrap gap-sm">
        {characters.map((char, i) => (
          <button
            key={i}
            className="word-hub__char-chip border-1 border-surface lh-1 hover-lift-sm transition-all cursor-pointer focus-ring-primary"
            onClick={() => handleCharacterClick(char.glyph)}
            aria-label={`Character: ${char.glyph}`}
          >
            <span className="font-lg fw-600">{char.glyph}</span>
            <span className="font-xs text-tertiary">{char.pinyin}</span>
            <span className="font-xs text-muted">{char.meaning}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
