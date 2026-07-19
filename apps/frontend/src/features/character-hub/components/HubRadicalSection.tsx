/**
 * @file HubRadicalSection.tsx
 * @description Character Detail Hub — Radical Decomposition section (Phase 2+)
 * Story 19.5: Character Hub Radical Section
 *
 * Displays clickable radical chips that compose the current character.
 * Phase-gated: visible only for Phase 2+ users.
 * Each chip navigates to the radical's detail in the radicals browser.
 *
 * Uses direct service import (loadMergedRadicals) instead of DI context —
 * the merge logic lives in services/mergeRadicals.ts.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { Box, Button, Skeleton } from "shared/components";
import { loadMergedRadicals } from "../services/mergeRadicals";
import type { RadicalEntry } from "../services/mergeRadicals";
import "./HubRadicalSection.css";

type HubRadicalSectionProps = {
  character: string;
  onClose: () => void;
  loading?: boolean;
};

export function HubRadicalSection({
  character,
  onClose,
  loading: externalLoading,
}: HubRadicalSectionProps) {
  const navigate = useNavigate();
  const { phaseGate } = usePhaseGate();
  const [isLoading, setIsLoading] = useState(true);
  const [matchingRadicals, setMatchingRadicals] = useState<RadicalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Phase gate: same pattern as RadicalsPage
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;

  useEffect(() => {
    let cancelled = false;

    // Reset state immediately to prevent stale data flash
    setMatchingRadicals([]);
    setError(null);
    setIsLoading(true);

    async function load() {
      try {
        const radicals = await loadMergedRadicals(character);
        if (!cancelled) setMatchingRadicals(radicals);
      } catch {
        if (!cancelled) {
          setError("Failed to load radicals. Please try again.");
          setMatchingRadicals([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [character]);

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

  if (error) {
    return (
      <div className="hub-radical-section flex-col gap-sm">
        <h3 className="font-sm text-secondary text-uppercase tracking-wide">
          Radical Decomposition
        </h3>
        <Box variant="error" padding="sm" className="flex-col gap-sm">
          <p className="font-xs text-error m-0 text-center">{error}</p>
          <div className="flex-center gap-sm">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadMergedRadicals(character)
                  .then((radicals) => {
                    setMatchingRadicals(radicals);
                    setIsLoading(false);
                  })
                  .catch(() => {
                    setError("Failed to load radicals. Please try again.");
                    setIsLoading(false);
                  });
              }}
              aria-label="Retry loading radicals"
            >
              Retry
            </Button>
          </div>
        </Box>
      </div>
    );
  }

  if (matchingRadicals.length === 0) {
    return (
      <div className="hub-radical-section flex-col gap-sm">
        <h3 className="font-sm text-secondary text-uppercase tracking-wide">
          Radical Decomposition
        </h3>
        <Box variant="dashed" padding="sm">
          <p className="font-xs text-muted m-0 text-center">No radicals found for "{character}"</p>
        </Box>
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
              onClose();
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
