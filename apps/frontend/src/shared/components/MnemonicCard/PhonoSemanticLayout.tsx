/**
 * @file PhonoSemanticLayout.tsx
 * @description Layout B: Phono-semantic — two-column meaning clue / sound clue grid.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Left column: "Meaning clue" — semantic radical info.
 * Right column: "Sound clue" — phonetic component info.
 * AI story renders full-width below the grid.
 */

import React from "react";
import { renderStoryText } from "./renderStoryText";

type PhonoSemanticLayoutProps = {
  character: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
};

/**
 * Layout B: Phono-semantic — two-column meaning clue / sound clue grid.
 *
 * Heuristic: splits radicalIds in half. The first half are shown as
 * meaning clues (semantic radicals) and the second half as sound clues
 * (phonetic components). When the API provides explicit
 * semanticRadicalIds/phoneticRadicalIds (future), update to use those instead.
 */
export const PhonoSemanticLayout = React.memo(function PhonoSemanticLayout({
  character,
  story,
  radicalIds,
  isEdited,
}: PhonoSemanticLayoutProps) {
  // Heuristic: splits radicalIds in half. When the API provides explicit
  // semanticRadicalIds/phoneticRadicalIds (future), update to use those instead.
  const midPoint = Math.ceil(radicalIds.length / 2);
  const meaningRadicals = radicalIds.slice(0, midPoint);
  const soundRadicals = radicalIds.slice(midPoint);

  return (
    <div aria-label={`Phono-semantic layout for ${character}`}>
      <div className="mnemonic-card__two-column">
        <div className="mnemonic-card__column">
          <div className="mnemonic-card__column-label">Meaning Clue</div>
          <div className="mnemonic-card__column-content">
            <p className="m-0">Semantic radical(s):</p>
            <div className="flex flex-wrap gap-xs mt-xs">
              {meaningRadicals.length > 0 ? (
                meaningRadicals.map((id) => (
                  <span key={id} className="mnemonic-card__radical-pill">
                    {id}
                  </span>
                ))
              ) : (
                <span className="text-muted font-xs">Radical data pending</span>
              )}
            </div>
          </div>
        </div>
        <div className="mnemonic-card__column">
          <div className="mnemonic-card__column-label">Sound Clue</div>
          <div className="mnemonic-card__column-content">
            <p className="m-0">Phonetic component(s):</p>
            <div className="flex flex-wrap gap-xs mt-xs">
              {soundRadicals.length > 0 ? (
                soundRadicals.map((id) => (
                  <span key={id} className="mnemonic-card__radical-pill">
                    {id}
                  </span>
                ))
              ) : (
                <span className="text-muted font-xs">Phonetic data pending</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {story && (
        <div className="mnemonic-card__story-container">
          <div className="mnemonic-card__story">{renderStoryText(story)}</div>
          {isEdited && <span className="mnemonic-card__edited-tag">(edited)</span>}
        </div>
      )}
    </div>
  );
});
