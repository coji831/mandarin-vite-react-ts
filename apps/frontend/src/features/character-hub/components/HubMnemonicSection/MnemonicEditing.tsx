/**
 * @file MnemonicEditing.tsx
 * @description Editing state for the Mnemonic section.
 * Story 20.2: Mnemonic Display UI
 */

import { Button, Textarea } from "shared/components";
import { useMnemonicStore } from "../../stores/mnemonicStore";

type MnemonicEditingProps = {
  character: string;
  story: string;
  onSave: (story: string) => void;
  onCancelEdit: () => void;
  isSaving?: boolean;
};

export function MnemonicEditing({
  character,
  story,
  onSave,
  onCancelEdit,
  isSaving = false,
}: MnemonicEditingProps) {
  const updateEdit = useMnemonicStore((s) => s.updateEdit);

  return (
    <div className="hub-mnemonic-section" aria-label={`Editing mnemonic for ${character}`}>
      <Textarea
        value={story}
        onChange={(newValue) => updateEdit(newValue)}
        placeholder="Write your mnemonic story…"
        maxLength={5000}
        rows={4}
        aria-label="Mnemonic story editor"
        disabled={isSaving}
      />
      <div className="flex gap-xs mt-xs">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onSave(story)}
          aria-label="Save mnemonic story"
          loading={isSaving}
          disabled={isSaving}
        >
          {isSaving ? "💾 Saving…" : "💾 Save"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancelEdit}
          aria-label="Cancel editing"
          disabled={isSaving}
        >
          ✖ Cancel
        </Button>
      </div>
    </div>
  );
}
