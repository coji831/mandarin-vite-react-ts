/**
 * @file MnemonicDisplay.tsx
 * @description Display + Cached states for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button } from "shared/components";
import { renderMarkdown } from "../../utils/renderMarkdown";
import "./MnemonicDisplay.css";

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
    <div className="hub-mnemonic-section min" aria-label={`Mnemonic story for ${character}`}>
      <div className="flex-between items-center">
        <div className="flex gap-xs flex-wrap">
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
      <div className="hub-mnemonic-section__story font-sm text-primary lh-normal">
        {renderMarkdown(story)}
      </div>
      {isEdited && <span className="font-xs text-muted font-italic">(edited)</span>}
    </div>
  );
}
