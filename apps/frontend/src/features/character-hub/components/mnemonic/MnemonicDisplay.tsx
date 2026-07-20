/**
 * @file MnemonicDisplay.tsx
 * @description Display + Cached states for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button } from "shared/components";

type MnemonicDisplayProps = {
  character: string;
  story: string;
  isEdited: boolean;
  onEdit: () => void;
  onRegenerate: () => void;
};

export function MnemonicDisplay({
  character,
  story,
  isEdited,
  onEdit,
  onRegenerate,
}: MnemonicDisplayProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Mnemonic story for ${character}`}>
      <div className="hub-mnemonic-section__header">
        <h3 className="font-sm text-secondary text-uppercase tracking-wide">Mnemonic Story</h3>
        <div className="hub-mnemonic-section__actions">
          <Button variant="icon" size="sm" onClick={onEdit} aria-label="Edit mnemonic story">
            ✏️
          </Button>
          <Button
            variant="icon"
            size="sm"
            onClick={onRegenerate}
            aria-label="Regenerate mnemonic story"
          >
            🔄
          </Button>
        </div>
      </div>
      <div className="hub-mnemonic-section__story font-sm text-primary">{story}</div>
      {isEdited && <span className="hub-mnemonic-section__edited">(edited)</span>}
    </div>
  );
}
