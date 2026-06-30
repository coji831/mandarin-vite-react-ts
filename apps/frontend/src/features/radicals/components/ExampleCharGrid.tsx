/**
 * @file components/ExampleCharGrid.tsx
 * @description Grid of ExampleCharCells with "See all" / "Show less" toggle
 * Story 19.2: Radical Detail Card
 */

import { useState } from "react";
import { ExampleCharCell } from "./ExampleCharCell";

const INITIAL_DISPLAY_COUNT = 12;

interface ExampleCharGridProps {
  characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export function ExampleCharGrid({ characters }: ExampleCharGridProps) {
  const [showAll, setShowAll] = useState(false);
  const total = characters.length;
  const displayChars = showAll ? characters : characters.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = total > INITIAL_DISPLAY_COUNT;

  return (
    <div className="example-char-section">
      <div className="example-char-section__header">
        <h3 className="font-md text-primary">Example Characters</h3>
        <p className="font-xs text-secondary">Characters containing this radical</p>
      </div>

      <div className="example-char-grid" role="list" aria-label="Example characters">
        {displayChars.map((ch) => (
          <div key={ch.glyph} role="listitem">
            <ExampleCharCell character={ch.glyph} pinyin={ch.pinyin} meaning={ch.meaning} />
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          className="example-char-grid__toggle"
          onClick={() => setShowAll((prev) => !prev)}
          type="button"
          aria-expanded={showAll}
        >
          {showAll ? `Show less` : `See all (${total}) ▸`}
        </button>
      )}
    </div>
  );
}
