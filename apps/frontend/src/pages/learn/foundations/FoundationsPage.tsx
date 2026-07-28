/**
 * @file FoundationsPage.tsx
 * @description Main Foundations page with 4 sub-tabs (Pinyin, Tones, Strokes, Animations)
 * Uses <Tabs> for the tab bar with panel wrapper.
 * Story 18.1: Foundations Page Structure
 */
import { useState } from "react";
import {
  FOUNDATION_SECTIONS,
  FOUNDATION_SECTION_LABELS,
  type FoundationSectionId,
} from "@mandarin/shared-constants";
import { Tabs } from "shared/components";
import type { TabConfig } from "shared/components";
import { FoundationsProgressBar } from "features/foundations";
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

const TABS_CONFIG: TabConfig[] = FOUNDATION_SECTIONS.map((id) => ({
  id,
  label: FOUNDATION_SECTION_LABELS[id],
  icon: SECTION_ICONS[id],
}));

export function FoundationsPage({ initialTab = "pinyin" }: { initialTab?: FoundationSectionId }) {
  const [activeTab, setActiveTab] = useState<FoundationSectionId>(initialTab);

  return (
    <div className="foundations-page flex-col">
      <Tabs
        tabs={TABS_CONFIG}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as FoundationSectionId)}
        align="center"
      >
        {activeTab === "pinyin" && <PinyinTab />}
        {activeTab === "tones" && <TonesTab />}
        {activeTab === "strokes" && <StrokeReferenceTab />}
        {activeTab === "animations" && <StrokeAnimationTab />}
      </Tabs>

      <FoundationsProgressBar />
    </div>
  );
}
