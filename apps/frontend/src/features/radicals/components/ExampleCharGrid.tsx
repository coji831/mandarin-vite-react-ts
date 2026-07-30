/**
 * @file components/ExampleCharGrid.tsx
 * @description Scrollable list of example character rows with audio + hub actions
 * Story 19.2: Radical Detail Card
 *
 * The list container has a max-height with overflow-y: auto and
 * custom-scrollbar so it scrolls independently instead of growing the modal.
 */

import { ExampleCharCell } from "./ExampleCharCell";
import "./ExampleCharGrid.css";

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
        {characters.map((ch) => (
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
    </div>
  );
}
