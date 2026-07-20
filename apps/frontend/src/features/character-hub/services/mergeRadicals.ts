/**
 * @file mergeRadicals.ts
 * @description Loads and merges radicals from two sources (HSK match + DB-backed)
 * Story 19.5: Character Hub Radical Section
 *
 * Previously part of HubServiceProvider — extracted to a plain service function
 * so HubRadicalSection can call it directly without DI indirection.
 */

import { radicalsService } from "../../radicals/services";
import { loadRadicalsByCharacter } from "./characterHubService";

export interface RadicalEntry {
  id: string;
  glyph: string;
  meaning: string;
  name_pinyin: string;
}

export async function loadMergedRadicals(character: string): Promise<RadicalEntry[]> {
  try {
    // Source 1: Match via hsk_characters
    const allRadicals = await radicalsService.loadAllRadicals();

    const hskMatches = allRadicals.filter((r) =>
      r.metadata.hsk_characters?.some((c) => c.glyph === character),
    );
    // Also check if character matches any radical's own glyph
    const selfMatch = allRadicals.filter((r) => r.glyph === character);
    const withSelf = [
      ...hskMatches,
      ...selfMatch.filter((r) => !hskMatches.find((m) => m.id === r.id)),
    ];

    // Source 2: Match via CharacterRadical table (DB-backed)
    const dbMatches = await loadRadicalsByCharacter(character);

    // Merge and deduplicate by id
    const allMatches = [...withSelf];
    for (const dbMatch of dbMatches) {
      if (!allMatches.find((m) => m.id === dbMatch.id)) {
        allMatches.push(dbMatch);
      }
    }

    // Map to the shared RadicalEntry type
    return allMatches.map((r) => ({
      id: r.id,
      glyph: r.glyph,
      meaning: r.meaning,
      name_pinyin: r.name_pinyin,
    }));
  } catch {
    console.warn("loadMergedRadicals: Failed to load radicals — returning empty");
    return [];
  }
}
