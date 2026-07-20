/**
 * @file CharacterHub.tsx
 * @description Character Detail Hub — Cardinal Layout (fully controlled)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 19.5: Character Hub Radical Section
 *
 * Fully controlled component — receives all data via props.
 * No store, no mock data, no Modal wrapper.
 * Content data (etymology, readings, words) is optional — when not provided,
 * sub-components render empty/placeholder states.
 */

import { Box } from "shared/components";
import { HubCharacterCard } from "./HubCharacterCard";
import { HubInfoLine } from "./HubInfoLine";
import { HubActions } from "./HubActions";
import { HubRadicalSection } from "./HubRadicalSection";
import { HubEtymology } from "./HubEtymology";
import { HubReadings } from "./HubReadings";
import type { ReadingInfo } from "./HubReadings";
import { HubCommonWords } from "./HubCommonWords";
import "./CharacterHub.css";

/** Optional character data for development/Storybook */
export type CharacterData = {
  etymology?: string;
  traditional?: string;
  hskLevel?: number;
  strokeCount?: number;
  frequencyRank?: number;
  readings?: ReadingInfo[];
  commonWords?: string[];
};

export type CharacterHubProps = {
  character: string;
  pinyin?: string | null;
  onClose: () => void;
  /** Optional data — in production this comes from an API */
  characterData?: CharacterData | null;
};

export function CharacterHub({ character, pinyin, onClose, characterData }: CharacterHubProps) {
  const loading = !character;
  const data = !loading ? characterData : undefined;

  return (
    <div className="hub-cardinal flex-col gap-sm">
      {/* NORTH: Etymology & character info */}
      <Box variant="card">
        <HubEtymology
          etymology={data?.etymology}
          traditional={data?.traditional}
          hskLevel={data?.hskLevel}
          strokeCount={data?.strokeCount}
          loading={loading}
        />
      </Box>

      {/* MIDDLE: West | Center | East */}
      <div className="hub-cardinal__middle grid gap-sm">
        {/* WEST: Radical decomposition */}
        <Box variant="card" className="height-full p-sm">
          <HubRadicalSection character={character} onClose={onClose} loading={loading} />
        </Box>

        {/* CENTER: Stroke animation + pinyin + audio */}
        <div className="flex-col-center">
          <HubCharacterCard character={character} loading={loading} />
        </div>

        {/* EAST: Readings + stats */}
        <Box variant="card" className="height-full p-sm">
          <HubReadings
            glyph={loading ? undefined : character}
            readings={data?.readings}
            frequencyRank={data?.frequencyRank}
            loading={loading}
          />
        </Box>
      </div>
      {/* SOUTH: Common words + actions */}
      <Box variant="card" className="hub-cardinal__south flex-col gap-md">
        <HubCommonWords commonWords={data?.commonWords} loading={loading} />
        <HubInfoLine character={character} pinyin={pinyin ?? null} />
        <HubActions character={character} />
      </Box>
    </div>
  );
}
