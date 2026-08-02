/**
 * @file components/ExampleCharGrid.tsx
 * @description Scrollable list of example character rows with audio + hub actions
 * Story 19.2: Radical Detail Card
 * VisFix W6a: Long lists are paginated — the first PAGE_SIZE rows render with a
 * "Show more" button that reveals the rest. The custom-scrollbar inner scroll is kept.
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "shared/components";
import { ExampleCharCell } from "./ExampleCharCell";
import "./ExampleCharGrid.css";

/** Number of example characters shown before the "Show more" reveal. */
const PAGE_SIZE = 24;

interface ExampleCharGridProps {
  characters: Array<{
    glyph: string;
    pinyin: string;
    meaning: string;
    classification?: string | null;
    etymology?: string | null;
  }>;
}

export function ExampleCharGrid({ characters }: ExampleCharGridProps) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = characters.length > PAGE_SIZE;

  // Reset pagination only when the radical actually changes (tracked by its first
  // glyph) — not on every re-render, which would undo a "Show more" click.
  const firstGlyphRef = useRef(characters[0]?.glyph);
  useEffect(() => {
    if (characters[0]?.glyph !== firstGlyphRef.current) {
      firstGlyphRef.current = characters[0]?.glyph;
      setShowAll(false);
    }
  }, [characters]);

  const visibleCharacters = showAll ? characters : characters.slice(0, PAGE_SIZE);
  const hiddenCount = characters.length - visibleCharacters.length;

  return (
    <div className="example-char-section flex flex-col">
      <div className="example-char-section__header">
        <h3 className="font-md text-primary m-0">Example Characters</h3>
        <p className="font-xs text-secondary m-0">Characters containing this radical</p>
      </div>

      <div
        className="example-char-list custom-scrollbar flex-col radius-sm border-1 border-surface"
        role="list"
        aria-label="Example characters"
      >
        {visibleCharacters.map((ch) => (
          <ExampleCharCell
            key={ch.glyph}
            character={ch.glyph}
            pinyin={ch.pinyin}
            meaning={ch.meaning}
            classification={ch.classification}
            etymology={ch.etymology}
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <div className="example-char-section__more flex justify-center p-sm">
          <Button variant="secondary" size="sm" onClick={() => setShowAll(true)}>
            Show more ({hiddenCount} more)
          </Button>
        </div>
      )}
    </div>
  );
}
