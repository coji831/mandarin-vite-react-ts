/**
 * @file HubActions.tsx
 * @description Character Detail Hub — Action buttons (Phase 1 minimal)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Single "Save to Review" button per Phase 1 wireframe.
 * Uses useCharacterHub().saveToReview for the API call (cross-cutting),
 * manages local UI state for loading/success transitions.
 */

import { Button } from "shared/components";
import { useState } from "react";
import { useReview } from "shared/hooks";

type HubActionsProps = {
  character: string;
};

export function HubActions({ character }: HubActionsProps) {
  const { saveToReview } = useReview();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveToReview = async () => {
    if (saved || isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      await saveToReview(character);
      setSaved(true);
    } catch (err) {
      console.error("Failed to save:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="hub-actions">
      <Button variant="primary" onClick={handleSaveToReview} loading={isSaving} disabled={saved}>
        {saved ? "✅ Saved!" : "💾 Save to Review"}
      </Button>
      {error && <p className="hub-actions__error font-xs text-error">{error}</p>}
    </div>
  );
}
