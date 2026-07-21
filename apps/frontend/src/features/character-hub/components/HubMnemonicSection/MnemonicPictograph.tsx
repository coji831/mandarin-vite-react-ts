/**
 * @file MnemonicPictograph.tsx
 * @description Pictograph state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import "./MnemonicPictograph.css";

type MnemonicPictographProps = {
  character: string;
  glyph: string;
};

export function MnemonicPictograph({ character, glyph }: MnemonicPictographProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Mnemonic story for ${character}`}>
      <div className="hub-mnemonic-section__pictograph bg-info-bg radius-md flex-col-center gap-sm p-md text-center">
        <span className="font-2xl" aria-hidden="true">
          🖼️
        </span>
        <p className="text-secondary font-sm m-0 lh-normal">
          This character (&ldquo;{glyph}&rdquo;) is a simple pictograph — its meaning is directly
          represented by its form. No mnemonic needed.
        </p>
      </div>
    </div>
  );
}
