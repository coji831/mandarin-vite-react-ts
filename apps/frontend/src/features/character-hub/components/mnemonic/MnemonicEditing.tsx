/**
 * @file MnemonicEditing.tsx
 * @description Editing state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button, Textarea } from "shared/components";
import type { MnemonicAction } from "./mnemonicReducer";

type MnemonicEditingProps = {
  character: string;
  story: string;
  dispatch: React.Dispatch<MnemonicAction>;
  onSave: (story: string) => void;
  onCancelEdit: () => void;
};

export function MnemonicEditing({
  character,
  story,
  dispatch,
  onSave,
  onCancelEdit,
}: MnemonicEditingProps) {
  return (
    <div className="hub-mnemonic-section" aria-label={`Editing mnemonic for ${character}`}>
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Edit Story</h3>
      <Textarea
        value={story}
        onChange={(newValue) => dispatch({ type: "EDIT_UPDATE", story: newValue })}
        placeholder="Write your mnemonic story…"
        maxLength={5000}
        rows={4}
        aria-label="Mnemonic story editor"
      />
      <div className="hub-mnemonic-section__edit-actions">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSave(story)}
          aria-label="Save mnemonic story"
        >
          💾 Save
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancelEdit} aria-label="Cancel editing">
          ✖ Cancel
        </Button>
      </div>
    </div>
  );
}
