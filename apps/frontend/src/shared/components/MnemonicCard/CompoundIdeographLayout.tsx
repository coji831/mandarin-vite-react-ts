/**
 * @file CompoundIdeographLayout.tsx
 * @description Layout C: Compound Ideograph — component breakdown + story.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Shows: "Meaning A: [component1] + Meaning B: [component2] → Combined: [character meaning]"
 * Each component shown with its radical ID as a label.
 * Story below explaining combination logic.
 */

import React from "react";
import { renderStoryText } from "./renderStoryText";

type CompoundIdeographLayoutProps = {
  character: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
};

/**
 * Layout C: Compound Ideograph — component breakdown with visual connectors.
 * Shows: "Meaning A: [component1] + Meaning B: [component2] → Combined: [character]"
 *
 * Visual connector elements (+, →) use existing CSS classes.
 */
export const CompoundIdeographLayout = React.memo(function CompoundIdeographLayout({
  character,
  story,
  radicalIds,
  isEdited,
}: CompoundIdeographLayoutProps) {
  return (
    <div aria-label={`Compound ideograph layout for ${character}`}>
      <div className="mnemonic-card__compound-breakdown">
        {radicalIds.length > 0 ? (
          radicalIds.map((id, index) => (
            <React.Fragment key={id}>
              {index > 0 && (
                <span className="mnemonic-card__compound-plus" aria-hidden="true">
                  +
                </span>
              )}
              <div className="mnemonic-card__compound-part">
                <span className="mnemonic-card__radical-pill">{id}</span>
                <span className="font-xs text-muted">Component {index + 1}</span>
              </div>
            </React.Fragment>
          ))
        ) : (
          <span className="text-muted font-sm">Component data pending</span>
        )}
        {radicalIds.length > 0 && (
          <span className="mnemonic-card__compound-arrow" aria-hidden="true">
            →
          </span>
        )}
        {radicalIds.length > 0 && (
          <span className="mnemonic-card__radical-pill">Combined: {character}</span>
        )}
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
