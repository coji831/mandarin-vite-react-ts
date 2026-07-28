/**
 * @file HubRadicalSection.tsx
 * @description Character Detail Hub — Radical Decomposition section (Phase 2+)
 * Story 19.5: Character Hub Radical Section
 *
 * Displays clickable radical chips that compose the current character.
 * Phase-gated: visible only for Phase 2+ users.
 * Each chip navigates to the radical's detail in the radicals browser.
 */

import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { Box, Button, Skeleton } from "shared/components";
import { useMergedRadicals } from "../../hooks/useMergedRadicals";
import "./HubRadicalSection.css";

type HubRadicalSectionProps = {
  character: string;
  onClose?: () => void;
  loading?: boolean;
};

export function HubRadicalSection({
  character,
  onClose,
  loading: externalLoading,
}: HubRadicalSectionProps) {
  const navigate = useNavigate();
  const { phaseGate } = usePhaseGate();
  const { radicals: matchingRadicals, isLoading, error, retry } = useMergedRadicals(character);

  // Phase gate: same pattern as RadicalsPage
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;

  // Phase gate: only render for Phase 2+ users
  if (effectivePhase < 2) return null;

  // Skeleton loading state (external or internal)
  if (externalLoading || isLoading) {
    return (
      <div
        className="hub-radical-section flex-col gap-sm"
        role="status"
        aria-label="Loading radicals"
      >
        <h3 className="font-sm text-secondary text-uppercase tracking-wide">
          Radical Decomposition
        </h3>
        <div className="hub-radical-section__skeleton-list flex flex-wrap gap-xs">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="custom"
              className="hub-radical-section__skeleton-chip radius-md"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hub-radical-section flex-col gap-sm">
      <h3 className="font-sm text-secondary text-uppercase tracking-wide">Radical Decomposition</h3>
      <div className="hub-radical-section__list flex flex-wrap gap-xs">
        {matchingRadicals.map((radical) => (
          <Button
            key={radical.id}
            variant="ghost-primary"
            size="sm"
            className="hub-radical-section__chip flex items-center gap-xs"
            onClick={() => {
              onClose?.();
              navigate(`/learn/radicals?highlight=${radical.id}`);
            }}
            aria-label={`View radical: ${radical.glyph} ${radical.meaning}`}
          >
            <span className="hub-radical-section__glyph font-md fw-600">{radical.glyph}</span>
            <span className="hub-radical-section__meaning font-xs text-tertiary">
              {radical.meaning}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
