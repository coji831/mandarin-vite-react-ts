/**
 * @file FoundationsPage.tsx
 * @description Main Foundations page with 4 sub-tabs (Pinyin, Tones, Strokes, Animations)
 * + local PictographGallery tab (Story 21.21)
 * Uses <Tabs> for the tab bar with panel wrapper.
 * Story 18.1: Foundations Page Structure
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 */
import { useState } from "react";
import {
  FOUNDATION_SECTIONS,
  FOUNDATION_SECTION_LABELS,
  type FoundationSectionId,
} from "@mandarin/shared-constants";
import { Tabs } from "shared/components";
import type { TabConfig } from "shared/components";
import {
  FoundationsProgressBar,
  PictographGallery,
  useFoundationsProgress,
} from "features/foundations";
import { PinyinTab } from "./PinyinTab";
import { TonesTab } from "./TonesTab";
import { StrokeReferenceTab } from "./StrokeReferenceTab";
import { StrokeAnimationTab } from "./StrokeAnimationTab";
import "./FoundationsPage.css";

const SECTION_ICONS: Record<FoundationSectionId, string> = {
  pinyin: "📗",
  tones: "🎵",
  strokes: "✏️",
  animations: "🎬",
};

const PICTOGRAPH_TAB: TabConfig = {
  id: "pictographs",
  label: "Pictographs",
  icon: "🖼️",
};

const TABS_CONFIG: TabConfig[] = [
  ...FOUNDATION_SECTIONS.map((id) => ({
    id,
    label: FOUNDATION_SECTION_LABELS[id],
    icon: SECTION_ICONS[id],
  })),
  PICTOGRAPH_TAB,
];

export function FoundationsPage({
  initialTab = "pinyin",
}: {
  initialTab?: FoundationSectionId | "pictographs";
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { progress } = useFoundationsProgress();
  const tonesCompleted = progress?.find((p) => p.sectionId === "tones")?.completed ?? false;

  const lockedTabs = tonesCompleted ? [] : ["pictographs"];

  // Pictographs are a Phase 2 gate requirement (see PictographMatchGame) —
  // locked until Tones (Phase 1 content) is completed. The <Tabs> component
  // renders this as a tooltip: "Complete Phase 2 to unlock".
  const getLockPhase = (id: string): number | null => (id === "pictographs" ? 2 : null);

  const handleTabChange = (tabId: string) => {
    if (lockedTabs.includes(tabId)) return; // Do nothing for locked tabs
    setActiveTab(tabId);
  };

  return (
    <div className="foundations-page flex-col">
      <Tabs
        tabs={TABS_CONFIG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        lockedTabs={lockedTabs}
        getLockPhase={getLockPhase}
        align="center"
      >
        {activeTab === "pinyin" && <PinyinTab />}
        {activeTab === "tones" && <TonesTab />}
        {activeTab === "strokes" && <StrokeReferenceTab />}
        {activeTab === "animations" && <StrokeAnimationTab />}
        {activeTab === "pictographs" && <PictographGallery />}
      </Tabs>

      <FoundationsProgressBar />
    </div>
  );
}
