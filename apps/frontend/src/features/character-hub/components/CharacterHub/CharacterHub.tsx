/**
 * @file CharacterHub.tsx
 * @description Character Detail Hub — Cardinal Layout with tabs
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 19.5: Character Hub Radical Section
 * Story 20.2: Mnemonic Display UI
 *
 * Layout:
 *   NORTH: HubIdentityCard (glyph, pinyin, meaning, badges, etymology)
 *   MIDDLE: West (radicals) | Center (stroke) | East (readings)
 *   TABS: Common Words | Mnemonic Story (user selects which to view)
 *   ACTIONS: Save to Review / Mark Learned (always visible at bottom)
 *
 * Each section fetches its own detail data independently.
 * Tabs reduce SOUTH-zone density while keeping all content accessible.
 */

import { useState } from "react";
import { Box, Tabs } from "shared/components";
import { HubCharacterCard } from "../HubCharacterCard/HubCharacterCard";
import { HubIdentityCard } from "../HubIdentityCard/HubIdentityCard";
import { HubActions } from "../HubActions/HubActions";
import { HubRadicalSection } from "../HubRadicalSection/HubRadicalSection";
import { HubMnemonicSection } from "../HubMnemonicSection/HubMnemonicSection";
import { HubReadings } from "../HubReadings/HubReadings";
import type { ReadingInfo } from "../HubReadings/HubReadings";
import { HubCommonWords } from "../HubCommonWords/HubCommonWords";
import "./CharacterHub.css";

/** Optional character data for Storybook/development — sections self-fetch in production */
export type CharacterData = {
  etymology?: string;
  traditional?: string;
  hskLevel?: number;
  strokeCount?: number;
  frequencyRank?: number;
  readings?: ReadingInfo[];
  commonWords?: string[];
  meaning?: string;
};

export type CharacterHubProps = {
  character: string;
  pinyin?: string | null;
  onClose: () => void;
  /** Optional mock data for Storybook — in production sections self-fetch */
  characterData?: CharacterData | null;
};

type HubTab = "words" | "story";

export function CharacterHub({ character, pinyin, onClose, characterData }: CharacterHubProps) {
  const loading = !character;
  const data = !loading ? characterData : undefined;
  const [activeTab, setActiveTab] = useState<HubTab>("story");

  return (
    <div className="hub-cardinal flex-1 flex-col gap-sm">
      {/* NORTH: Character identity card */}
      <Box variant="card" className="hub-cardinal__identity shrink-0 p-sm">
        <HubIdentityCard
          character={character}
          pinyin={pinyin}
          meaning={data?.meaning}
          hskLevel={data?.hskLevel}
          strokeCount={data?.strokeCount}
          traditional={data?.traditional}
          frequencyRank={data?.frequencyRank}
          etymology={data?.etymology}
          loading={loading}
        />
      </Box>

      {/* MIDDLE: West | Center | East — fixed 270px height */}
      <div className="hub-cardinal__middle flex-1 grid gap-sm">
        {/* WEST: Radical decomposition */}
        <Box variant="card" className="hub-cardinal__side-panel h-full p-sm flex-col gap-sm">
          <HubRadicalSection character={character} onClose={onClose} loading={loading} />
        </Box>

        {/* CENTER: Stroke animation */}
        <div className="hub-cardinal__center h-full flex-col-center">
          <HubCharacterCard character={character} loading={loading} />
        </div>

        {/* EAST: Readings + stats */}
        <Box variant="card" className="hub-cardinal__side-panel h-full p-sm">
          <HubReadings
            glyph={loading ? undefined : character}
            readings={data?.readings}
            frequencyRank={data?.frequencyRank}
            loading={loading}
          />
        </Box>
      </div>

      {/* TABS: Common Words | Mnemonic Story — fixed 220px height */}
      <Box variant="card" className="hub-tab-area shrink-0 p-0 overflow-hidden flex-col">
        <Tabs
          tabs={[
            { id: "words", label: "Common Words", icon: "📖" },
            { id: "story", label: "Mnemonic Story", icon: "📝" },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as HubTab)}
          align="start"
          variant="underline"
        >
          {activeTab === "words" ? (
            <HubCommonWords
              commonWords={data?.commonWords}
              loading={loading}
              glyph={loading ? undefined : character}
            />
          ) : (
            <HubMnemonicSection character={character} />
          )}
        </Tabs>
      </Box>

      {/* ACTIONS: Always visible at bottom */}
      <div className="flex-center p-sm">
        <HubActions character={character} />
      </div>
    </div>
  );
}
