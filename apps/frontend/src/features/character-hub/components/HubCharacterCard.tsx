/**
 * @file HubCharacterCard.tsx
 * @description Character Detail Hub — Center zone: stroke animation + controls
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Center-anchored: animated character with play controls.
 * No card wrapper — the character IS the focal point.
 * Supports loading skeleton state.
 *
 * Imports CharacterStrokePlayer directly from shared components —
 * no longer uses HubServiceContext DI indirection.
 */

import { Skeleton, CharacterStrokePlayer } from "shared/components";
import "./HubCharacterCard.css";

type HubCharacterCardProps = {
  character: string;
  loading?: boolean;
};

export function HubCharacterCard({ character, loading }: HubCharacterCardProps) {
  if (loading) {
    return (
      <div
        className="hub-center flex-col items-center gap-xs"
        role="status"
        aria-label="Loading character"
      >
        {/* Canvas skeleton */}
        <Skeleton
          variant="custom"
          className="hub-center-canvas-skeleton radius-lg"
          aria-hidden="true"
        />
        {/* Controls skeleton */}
        <div className="flex gap-xs">
          <Skeleton
            variant="custom"
            className="hub-center-ctrl-skeleton radius-sm"
            aria-hidden="true"
          />
          <Skeleton
            variant="custom"
            className="hub-center-ctrl-skeleton radius-sm"
            aria-hidden="true"
          />
          <Skeleton
            variant="custom"
            className="hub-center-ctrl-skeleton radius-sm"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="hub-center flex-col items-center gap-xs"
      role="region"
      aria-label={`Stroke animation for ${character}`}
    >
      <CharacterStrokePlayer character={character} mode="mini" />
    </div>
  );
}
