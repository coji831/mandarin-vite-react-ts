/**
 * @file components/SuggestedCharacters.tsx
 * @description Suggested characters row for stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

import "./SuggestedCharacters.css";

export interface SuggestedCharactersProps {
  suggestedCharacters: string[];
  currentCharacter: string;
  onSelect: (char: string) => void;
}

/**
 * Renders a row of clickable suggested character buttons.
 * Highlights the currently active character.
 */
export function SuggestedCharacters({
  suggestedCharacters,
  currentCharacter,
  onSelect,
}: SuggestedCharactersProps) {
  return (
    <section className="flex-col">
      <div className="stroke-anim-suggested bg-surface-dark-alt border-default radius-md">
        <span className="stroke-anim-suggested-label font-xs whitespace-nowrap shrink-0 text-muted">
          Suggested characters:
        </span>
        <div className="flex gap-xs flex-wrap">
          {suggestedCharacters.map((char) => (
            <button
              key={char}
              className={`stroke-anim-suggested-btn font-md cursor-pointer border-default radius-sm text-secondary ${currentCharacter === char ? "stroke-anim-suggested-btn--active fw-600" : ""}`}
              onClick={() => onSelect(char)}
              aria-label={`Show stroke animation for ${char}`}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
