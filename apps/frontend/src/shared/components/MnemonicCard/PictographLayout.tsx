/**
 * @file PictographLayout.tsx
 * @description Layout A: Pictograph — etymology + "Try visualizing" note.
 * Story 21.20: Classification-Aware Mnemonic UI
 *
 * Shows a large character glyph, original meaning description,
 * and a "Try visualizing" note. No AI story column by default
 * — pictographs are visual, not compositional.
 */

import React from "react";

type PictographLayoutProps = {
  character: string;
  story: string;
  isEdited: boolean;
  /**
   * Optional URL to an oracle bone / ancient form illustration of the character.
   * When provided, renders an image showing the character's earliest known form.
   * Feature is data-dependent and not yet available from the API.
   */
  ancientFormUrl?: string;
};

/**
 * Layout A: Pictograph — large character glyph, etymology, and visualization prompt.
 * Accepts an optional ancientFormUrl for oracle bone / ancient form illustrations
 * (data-dependent — currently unused until the API provides this data).
 */
export const PictographLayout = React.memo(function PictographLayout({ character, story, isEdited, ancientFormUrl }: PictographLayoutProps) {
  return (
    <div aria-label={`Pictograph layout for ${character}`}>
      <div className="mnemonic-card__glyph">{character}</div>

      {story ? (
        <div className="mnemonic-card__pictograph-info">
          <p className="text-secondary font-sm m-0 lh-normal">{story}</p>
          {isEdited && (
            <span className="mnemonic-card__edited-tag">(edited)</span>
          )}
        </div>
      ) : (
        <div className="mnemonic-card__pictograph-info">
          <p className="text-tertiary font-sm m-0 lh-normal">
            This character (&ldquo;{character}&rdquo;) is a simple pictograph—
            its meaning is directly represented by its form.
          </p>
        </div>
      )}

      {ancientFormUrl && (
        <div className="mnemonic-card__pictograph-info">
          <img
            src={ancientFormUrl}
            alt={`Ancient form of ${character}`}
            className="mnemonic-card__ancient-form"
          />
        </div>
      )}

      <div className="mnemonic-card__pictograph-note">
        Try visualizing the character &ldquo;{character}&rdquo; in your mind.
        Picture the object or concept it depicts.
      </div>
    </div>
  );
});
