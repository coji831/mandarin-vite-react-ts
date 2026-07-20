/**
 * @file MnemonicEmpty.tsx
 * @description Empty state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button } from "shared/components";

type MnemonicEmptyProps = {
  character: string;
  onGenerate: () => void;
};

export function MnemonicEmpty({ character, onGenerate }: MnemonicEmptyProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Mnemonic story for ${character}`}>
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Mnemonic Story</h3>
      <div className="hub-mnemonic-section__empty">
        <p className="font-sm text-muted m-0">No mnemonic story yet.</p>
        <Button
          variant="primary"
          size="sm"
          onClick={onGenerate}
          aria-label="Generate mnemonic story"
        >
          ✨ Generate Story
        </Button>
      </div>
    </div>
  );
}
