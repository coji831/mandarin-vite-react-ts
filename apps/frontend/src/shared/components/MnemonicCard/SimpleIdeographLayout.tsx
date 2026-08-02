/**
 * @file SimpleIdeographLayout.tsx
 * @description Layout D: Simple Ideograph — concise explanation + AI story.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Minimal layout — no columns or component breakdown.
 * Shows a concise explanation paragraph and the AI-generated story.
 */

import React from "react";
import { renderStoryText } from "./renderStoryText";

type SimpleIdeographLayoutProps = {
  character: string;
  story: string;
  isEdited: boolean;
};

/**
 * Layout D: Simple Ideograph — concise explanation + AI story.
 */
export const SimpleIdeographLayout = React.memo(function SimpleIdeographLayout({
  character,
  story,
  isEdited,
}: SimpleIdeographLayoutProps) {
  return (
    <div aria-label={`Simple ideograph layout for ${character}`}>
      <div className="mnemonic-card__glyph">{character}</div>

      {story ? (
        <div className="mnemonic-card__story-container">
          <div className="mnemonic-card__story">{renderStoryText(story)}</div>
          {isEdited && <span className="mnemonic-card__edited-tag">(edited)</span>}
        </div>
      ) : (
        <p className="text-tertiary font-sm m-0 lh-normal">
          This character (&ldquo;{character}&rdquo;) is an ideograph representing an abstract
          concept. No mnemonic story is currently available.
        </p>
      )}
    </div>
  );
});
