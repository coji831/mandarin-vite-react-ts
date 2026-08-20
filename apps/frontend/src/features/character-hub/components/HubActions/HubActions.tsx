/**
 * @file HubActions.tsx
 * @description Character Detail Hub — Action buttons (Phase 1 minimal)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Single "Save to Review" and "Mark Learned" buttons per Phase 1 wireframe.
 * Uses useReview for the API call (cross-cutting),
 * manages local UI state for loading/success transitions.
 */

import { Button, Icon } from "shared/components";
import { useState } from "react";
import { useReview } from "shared/hooks";
import { useAuth } from "features/auth";

type HubActionsProps = {
  character: string;
};

type FailedAction = "save" | "mark" | null;

export function HubActions({ character }: HubActionsProps) {
  const { saveToReview, markLearned } = useReview();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAction, setFailedAction] = useState<FailedAction>(null);
  const { isAuthenticated } = useAuth();

  // Bug 2: these actions are backed by a stub (no backend call) — showing
  // "✅ Saved!"/"✓ Learned!" to guests would be fake success. Hide the
  // registered-only actions for guests entirely (the mnemonic tab already
  // carries the sign-in upsell within this modal).
  if (!isAuthenticated) return null;

  const handleSaveToReview = async () => {
    if (saved || isSaving) return;
    setError(null);
    setFailedAction(null);
    setIsSaving(true);
    try {
      await saveToReview(character);
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
      setFailedAction("save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkLearned = async () => {
    if (marked || isMarking) return;
    setError(null);
    setFailedAction(null);
    setIsMarking(true);
    try {
      await markLearned(character);
      setMarked(true);
    } catch {
      setError("Failed to mark as learned. Please try again.");
      setFailedAction("mark");
    } finally {
      setIsMarking(false);
    }
  };

  const handleRetry = () => {
    if (!failedAction) return;
    setError(null);
    setFailedAction(null);
    if (failedAction === "save") {
      handleSaveToReview();
    } else {
      handleMarkLearned();
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
          {saved ? (
            <>
              <Icon name="check" size={16} aria-hidden /> Saved!
            </>
          ) : (
            <>
              <Icon name="save" size={16} aria-hidden /> Save to Review
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleMarkLearned}
          loading={isMarking}
          disabled={marked}
        >
          <Icon name="check" size={16} aria-hidden />
          {marked ? "Learned!" : "Mark Learned"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-xs">
          <p className="font-xs text-error m-0">{error}</p>
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
