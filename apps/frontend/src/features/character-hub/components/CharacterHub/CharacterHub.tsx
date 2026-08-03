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
 *   ACTIONS: registered-only — HubActions renders null for guests (no fake Save/Learned)
 *
 * Each section fetches its own detail data independently.
 * Tabs reduce SOUTH-zone density while keeping all content accessible.
 */

import { useState } from "react";
import { Box, Tabs } from "shared/components";
import { HubActions } from "../HubActions/HubActions";
import { HubCharacterCard } from "../HubCharacterCard/HubCharacterCard";
import { HubCommonWords } from "../HubCommonWords/HubCommonWords";
import { HubIdentityCard } from "../HubIdentityCard/HubIdentityCard";
import { HubMnemonicSection } from "../HubMnemonicSection/HubMnemonicSection";
import { HubRadicalSection } from "../HubRadicalSection/HubRadicalSection";
import { HubReadings } from "../HubReadings/HubReadings";
import "./CharacterHub.css";

export type CharacterHubProps = {
  entityId: string;
  entityLabel?: string | null;
};

type HubTab = "words" | "story";

export function CharacterHub({ entityId, entityLabel }: CharacterHubProps) {
  const character = entityId;
  const pinyin = entityLabel ?? null;
  const loading = !character;
  const [activeTab, setActiveTab] = useState<HubTab>("story");

  return (
    <div className="hub-cardinal flex-1 flex-col gap-sm">
      {/* NORTH: Character identity card */}
      <Box variant="card" className="hub-cardinal__identity shrink-0 p-sm">
        <HubIdentityCard character={character} pinyin={pinyin} loading={loading} />
      </Box>

      {/* MIDDLE: West | Center | East — fixed 270px height */}
      <div className="hub-cardinal__middle flex-1 grid gap-sm">
        {/* WEST: Radical decomposition */}
        <Box variant="card" className="hub-cardinal__side-panel h-full p-sm flex-col gap-sm">
          <HubRadicalSection character={character} loading={loading} />
        </Box>

        {/* CENTER: Stroke animation */}
        <div className="hub-cardinal__center h-full flex-col-center">
          <HubCharacterCard character={character} loading={loading} />
        </div>

        {/* EAST: Readings + stats */}
        <Box variant="card" className="hub-cardinal__side-panel h-full p-sm">
          <HubReadings glyph={loading ? undefined : character} loading={loading} />
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
            <HubCommonWords glyph={loading ? undefined : character} loading={loading} />
          ) : (
            <HubMnemonicSection character={character} />
          )}
        </Tabs>
      </Box>

      {/* ACTIONS: registered-only — HubActions renders null for guests (no fake Save/Learned) */}
      <div className="flex-center p-sm">
        <HubActions character={character} />
      </div>
    </div>
  );
}
