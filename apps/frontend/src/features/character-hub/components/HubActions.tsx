/**
 * @file HubActions.tsx
 * @description Character Detail Hub — Action buttons (Phase 1 minimal)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 20.2: Mnemonic Display UI
 *
 * Single "Save to Review" button per Phase 1 wireframe.
 * Uses useReview for the API call (cross-cutting),
 * manages local UI state for loading/success transitions.
 *
 * Added in Story 20.2: 📖 "View Story" button (phase-gated via HubMnemonicSection).
 */

import { Button } from "shared/components";
import { useState } from "react";
import { useReview } from "shared/hooks";
import { PICTOGRAPH_CHARS } from "../services";

type HubActionsProps = {
  character: string;
  onOpenMnemonic?: () => void;
};

export function HubActions({ character, onOpenMnemonic }: HubActionsProps) {
  const { saveToReview, markLearned } = useReview();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveToReview = async () => {
    if (saved || isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      await saveToReview(character);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkLearned = async () => {
    if (marked || isMarking) return;
    setError(null);
    setIsMarking(true);
    try {
      await markLearned(character);
      setMarked(true);
    } catch {
      setError("Failed to mark as learned. Please try again.");
    } finally {
      setIsMarking(false);
    }
  };

  const isPictograph = PICTOGRAPH_CHARS.has(character);

  return (
    <div className="flex-col items-center gap-xs">
      <div className="flex-center gap-sm">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveToReview}
          loading={isSaving}
          disabled={saved}
        >
          {saved ? "✅ Saved!" : "💾 Save to Review"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleMarkLearned}
          loading={isMarking}
          disabled={marked}
        >
          {marked ? "✓ Learned!" : "✓ Mark Learned"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenMnemonic}
          aria-disabled={isPictograph || undefined}
          title={isPictograph ? "This character is a simple pictograph" : "View mnemonic story"}
          aria-label={isPictograph ? "View story (pictograph)" : "View mnemonic story"}
        >
          📖 View Story
        </Button>
      </div>
      {error && <p className="font-xs text-error">{error}</p>}
    </div>
  );
}
