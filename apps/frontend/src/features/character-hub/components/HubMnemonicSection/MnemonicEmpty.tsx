/**
 * @file MnemonicEmpty.tsx
 * @description Empty state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 *
 * The generate action is a GHOST: the lexical hub sheet carries no primary at
 * all (a peek is reading, not a task with a next step), so a filled button here
 * was the single amber control on a surface that has none.
 */

import { Button, Icon } from "shared/components";

type MnemonicEmptyProps = {
  character: string;
  onGenerate: () => void;
};

export function MnemonicEmpty({ character, onGenerate }: MnemonicEmptyProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Mnemonic story for ${character}`}>
      <div className="flex-col-center gap-sm p-md">
        <p className="font-sm text-muted m-0">No mnemonic story yet.</p>
        <Button variant="ghost" size="sm" onClick={onGenerate} aria-label="Generate mnemonic story">
          <Icon name="sparkles" size={16} aria-hidden />
          Generate Story
        </Button>
      </div>
    </div>
  );
}
