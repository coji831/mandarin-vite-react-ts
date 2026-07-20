/**
 * @file HubActions.tsx
 * @description Character Detail Hub — Action buttons (Phase 1 minimal)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Single "Save to Review" button per Phase 1 wireframe.
 * Uses useReview for the API call (cross-cutting),
 * manages local UI state for loading/success transitions.
 */

import { Button } from "shared/components";
import { useState } from "react";
import { useReview } from "shared/hooks";

type HubActionsProps = {
  character: string;
};

export function HubActions({ character }: HubActionsProps) {
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
      </div>
      {error && <p className="font-xs text-error">{error}</p>}
    </div>
  );
}
