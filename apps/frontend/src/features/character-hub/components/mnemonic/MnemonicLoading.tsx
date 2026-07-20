/**
 * @file MnemonicLoading.tsx
 * @description Loading + Generating states for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Spinner } from "shared/components";

type MnemonicLoadingProps = {
  character: string;
  isGenerating?: boolean;
};

export function MnemonicLoading({ character, isGenerating = false }: MnemonicLoadingProps) {
  return (
    <div
      className="hub-mnemonic-section"
      role="status"
      aria-label={
        isGenerating ? `Generating mnemonic for ${character}` : `Loading mnemonic for ${character}`
      }
    >
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Mnemonic Story</h3>
      <div className="hub-mnemonic-section__generating">
        <Spinner size="sm" />
        <p className="hub-mnemonic-section__generating-text">
          {isGenerating ? "Creating mnemonic story…" : "Loading story…"}
        </p>
      </div>
    </div>
  );
}
