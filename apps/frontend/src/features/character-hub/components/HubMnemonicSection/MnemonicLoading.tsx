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
      <div className="flex-col-center gap-sm">
        <Spinner size="sm" />
        <p className="text-secondary font-sm m-0">
          {isGenerating ? "Creating mnemonic story…" : "Loading story…"}
        </p>
      </div>
    </div>
  );
}
