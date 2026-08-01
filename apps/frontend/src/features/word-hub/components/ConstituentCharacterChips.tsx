import { Chip } from "shared/components";
import { openHub } from "shared/store";

/**
 * @file ConstituentCharacterChips.tsx
 * @description Renders clickable chips for characters that make up a word.
 * Extracted from WordHubContent for reuse. Chips are the shared Chip component
 * (interactive, opens the Character Detail Hub via openHub).
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */
interface ConstituentCharacterChipsProps {
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function ConstituentCharacterChips({ characters }: ConstituentCharacterChipsProps) {
  if (!characters || characters.length === 0) return null;
  const handleCharacterClick = (charGlyph: string) => {
    openHub({ entityType: "character", entityId: charGlyph, label: charGlyph });
  };
  return (
    <div className="flex-col gap-sm">
      <span className="font-sm text-tertiary fw-600">Characters in this word</span>
      <div className="flex-row flex-wrap gap-sm">
        {characters.map((char, i) => (
          <Chip
            key={i}
            interactive
            variant="surface"
            size="md"
            onClick={() => handleCharacterClick(char.glyph)}
            ariaLabel={`Character: ${char.glyph}`}
            className="h-auto py-xs radius-md flex-col items-center bg-surface-light-5"
          >
            <span className="font-lg fw-600">{char.glyph}</span>
            <span className="font-xs text-tertiary">{char.pinyin}</span>
            <span className="font-xs text-muted">{char.meaning}</span>
          </Chip>
        ))}
      </div>
    </div>
  );
}
