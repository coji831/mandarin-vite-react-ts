/**
 * @file MnemonicPictograph.tsx
 * @description Pictograph state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

type MnemonicPictographProps = {
  character: string;
  glyph: string;
};

export function MnemonicPictograph({ character, glyph }: MnemonicPictographProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Mnemonic story for ${character}`}>
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Mnemonic Story</h3>
      <div className="hub-mnemonic-section__pictograph">
        <span className="hub-mnemonic-section__pictograph-icon" aria-hidden="true">
          🖼️
        </span>
        <p className="hub-mnemonic-section__pictograph-text">
          This character (&ldquo;{glyph}&rdquo;) is a simple pictograph — its meaning is directly
          represented by its form. No mnemonic needed.
        </p>
      </div>
    </div>
  );
}
