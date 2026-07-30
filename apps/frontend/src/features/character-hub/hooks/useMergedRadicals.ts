/**
 * @file useMergedRadicals.ts
 * @description Hook for loading and merging radicals from two sources.
 *
 * Was previously a service function (loadMergedRadicals in characterService.ts).
 * Moved to a hook so loading/error state is encapsulated naturally.
 *
 * Merges radicals from:
 *   1. CharacterRadical table (DB-backed via API — primary source)
 *   2. Self-match where the character glyph matches a radical's own glyph
 * Deduplicates by radical ID.
 *
 * Note: hsk_characters in radical metadata has been removed (Story 21.11).
 * All character-to-radical mappings now come from the backend API.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { loadRadicalsByCharacter } from "../services";
import { radicalsService } from "../../radicals/services";
import type { RadicalData } from "features/radicals/types";

export interface RadicalEntry {
  id: string;
  glyph: string;
  meaning: string;
  name_pinyin: string;
}

interface UseMergedRadicalsResult {
  radicals: RadicalEntry[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

async function fetchMergedRadicals(character: string): Promise<RadicalEntry[]> {
  // Source 1: Match via CharacterRadical table (DB-backed)
  const dbMatches = await loadRadicalsByCharacter(character);

  // Source 2: Check if character matches any radical's own glyph (self-match)
  const allRadicals = await radicalsService.loadAllRadicals();
  const selfMatch = allRadicals.filter((r) => r.glyph === character);

  // Merge and deduplicate by id (favor DB matches first)
  const merged = [...(dbMatches as unknown as RadicalData[])];
  for (const self of selfMatch) {
    if (!merged.find((m) => m.id === self.id)) {
      merged.push(self);
    }
  }

  return merged.map((r) => ({
    id: r.id,
    glyph: r.glyph,
    meaning: r.meaning,
    name_pinyin: r.name_pinyin,
  }));
}

export function useMergedRadicals(character: string): UseMergedRadicalsResult {
  const [radicals, setRadicals] = useState<RadicalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    cancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    setRadicals([]);

    try {
      const result = await fetchMergedRadicals(character);
      if (!cancelledRef.current) {
        setRadicals(result);
      }
    } catch {
      if (!cancelledRef.current) {
        setError("Failed to load radicals. Please try again.");
      }
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, [character]);

  useEffect(() => {
    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  return { radicals, isLoading, error, retry: load };
}
