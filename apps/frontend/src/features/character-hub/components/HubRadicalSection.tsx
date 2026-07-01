/**
 * @file HubRadicalSection.tsx
 * @description Character Detail Hub — Radical Decomposition section (Phase 2+)
 * Story 19.5: Character Hub Radical Section
 *
 * Displays clickable radical chips that compose the current character.
 * Phase-gated: visible only for Phase 2+ users.
 * Each chip navigates to the radical's detail in the radicals browser.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { radicalsService } from "features/radicals/services";
import { loadRadicalsByCharacter } from "../services/characterHubService";
import type { RadicalData } from "features/radicals/types";
import "./HubRadicalSection.css";

type HubRadicalSectionProps = {
  character: string;
  onClose: () => void;
};

export function HubRadicalSection({ character, onClose }: HubRadicalSectionProps) {
  const navigate = useNavigate();
  const { phaseGate } = usePhaseGate();
  const [isLoading, setIsLoading] = useState(true);
  const [matchingRadicals, setMatchingRadicals] = useState<RadicalData[]>([]);

  // Phase gate: same pattern as RadicalsPage
  const defaultPhase = import.meta.env.DEV ? 3 : 1;
  const effectivePhase = phaseGate?.currentPhase ?? defaultPhase;

  useEffect(() => {
    let cancelled = false;

    // Reset state immediately to prevent stale data flash
    setMatchingRadicals([]);
    setIsLoading(true);

    async function load() {
      try {
        // Source 1: Match via hsk_characters (existing)
        const allRadicals = await radicalsService.loadAllRadicals();
        if (cancelled) return;

        const hskMatches = allRadicals.filter((r) =>
          r.metadata.hsk_characters?.some((c) => c.glyph === character),
        );
        // Also check if character matches any radical's own glyph
        // (handles is_also_character radicals like 口, 水, 火)
        const selfMatch = allRadicals.filter((r) => r.glyph === character);
        const withSelf = [
          ...hskMatches,
          ...selfMatch.filter((r) => !hskMatches.find((m) => m.id === r.id)),
        ];

        // Source 2: Match via CharacterRadical table (new - supports multi-radical)
        const dbMatches = await loadRadicalsByCharacter(character);

        // Merge and deduplicate by id
        const allMatches = [...withSelf];
        for (const dbMatch of dbMatches) {
          if (!allMatches.find((m) => m.id === dbMatch.id)) {
            allMatches.push(dbMatch);
          }
        }

        if (!cancelled) setMatchingRadicals(allMatches);
      } catch {
        if (!cancelled) setMatchingRadicals([]);
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

  // Loading state with accessible indicator
  if (isLoading) {
    return (
      <div className="hub-radical-section">
        <h3 className="hub-radical-section__title">Radical Decomposition</h3>
        <div className="hub-radical-section__loading" role="status" aria-label="Loading radicals">
          <span className="hub-radical-section__loading-text">Loading radicals...</span>
        </div>
      </div>
    );
  }

  // Empty state: no radicals found for this character
  if (matchingRadicals.length === 0) return null;

  return (
    <div className="hub-radical-section">
      <h3 className="hub-radical-section__title">Radical Decomposition</h3>
      <div className="hub-radical-section__list">
        {matchingRadicals.map((radical) => (
          <button
            key={radical.id}
            className="hub-radical-section__chip"
            onClick={() => {
              onClose();
              navigate(`/learn/radicals?radical=${radical.id}`);
            }}
            aria-label={`Radical: ${radical.glyph} - ${radical.meaning} radical`}
            type="button"
          >
            <span className="hub-radical-section__glyph">{radical.glyph}</span>
            <span className="hub-radical-section__name">{radical.name_pinyin}</span>
            <span className="hub-radical-section__meaning">{radical.meaning}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
