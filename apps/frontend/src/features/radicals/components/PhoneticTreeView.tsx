/**
 * @file components/PhoneticTreeView.tsx
 * @description Phonetic tree view — shows characters grouped by shared phonetic component
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 *
 * States:
 * - Loading: Skeleton while fetching families
 * - Phase 2 preview: Top 10 families with locked banner
 * - Phase 3 full: All ~100+ families
 * - Empty: No phonetic families found
 * - Error: ErrorScreen with retry
 *
 * Data flow:
 * 1. Fetches phonetic families list from Phonetic Clusters API
 * 2. When user expands a family, fetches detail + enriches with classification
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Skeleton, ErrorScreen } from "shared/components";
import { PhoneticFamilyNode } from "./PhoneticFamilyNode";
import {
  getPhoneticFamilies,
  type PhoneticFamily,
} from "../services/phoneticTreeService";
import "./PhoneticTreeView.css";

interface PhoneticTreeViewProps {
  isPhase3: boolean;
}

/** Number of families shown in Phase 2 preview. */
const PHASE2_PREVIEW_COUNT = 10;

export function PhoneticTreeView({ isPhase3 }: PhoneticTreeViewProps) {
  const [families, setFamilies] = useState<PhoneticFamily[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPhoneticFamilies();
      setFamilies(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load phonetic families";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const handleRetry = useCallback(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // Derive display families based on phase gating
  const displayFamilies = isPhase3
    ? families
    : families.slice(0, PHASE2_PREVIEW_COUNT);

  const totalFamilyCount = families.length;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="phonetic-tree-view w-full">
        <div className="phonetic-tree-view__loading flex-col flex-center p-xl" role="status">
          <Skeleton variant="custom" height="60px" className="w-full radius-lg" />
          <span className="text-muted font-sm">Loading phonetic families…</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="phonetic-tree-view w-full">
        <ErrorScreen error={error} onRetry={handleRetry} title="Failed to load phonetic families" />
      </div>
    );
  }

  // ── Empty state ──
  if (families.length === 0) {
    return (
      <div className="phonetic-tree-view w-full">
        <div className="phonetic-tree-view__empty flex-col flex-center p-xl gap-sm">
          <span className="font-3xl" aria-hidden="true">
            🏠
          </span>
          <p className="text-muted font-lg">No phonetic families found.</p>
          <p className="text-muted font-sm">Phonetic cluster data may not be available yet.</p>
        </div>
      </div>
    );
  }

  // ── Success state ──
  return (
    <div className="phonetic-tree-view w-full flex-col gap-sm">
      {/* Phase 2 preview banner */}
      {!isPhase3 && totalFamilyCount > PHASE2_PREVIEW_COUNT && (
        <Box variant="dark" padding="sm" className="phonetic-tree-view__preview-banner">
          <p className="font-sm text-muted text-center p-sm">
            🔒 Showing top {PHASE2_PREVIEW_COUNT} of {totalFamilyCount} phonetic families. Unlock
            Phase 3 to see all ~{totalFamilyCount} families.
          </p>
        </Box>
      )}

      {/* Families list */}
      <div
        className="phonetic-tree-view__families flex-col gap-sm p-sm"
        role="list"
        aria-label="Phonetic families"
      >
        {displayFamilies.map((family) => (
          <PhoneticFamilyNode
            key={family.id}
            family={family}
          />
        ))}
      </div>
    </div>
  );
}
