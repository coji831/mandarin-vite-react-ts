/**
 * @file components/SuggestedCharacters.tsx
 * @description Suggested characters row for stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

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
    <section className="stroke-anim-section">
      <div className="stroke-anim-suggested">
        <span className="stroke-anim-suggested-label">Suggested characters:</span>
        <div className="stroke-anim-suggested-list">
          {suggestedCharacters.map((char) => (
            <button
              key={char}
              className={`stroke-anim-suggested-btn ${currentCharacter === char ? "stroke-anim-suggested-btn--active" : ""}`}
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
