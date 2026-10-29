/**
 * @file pages/learn/foundations/FoundationsReferencePage.tsx
 * @description The dense FOUNDATIONS REFERENCE — the 409-cell index, at
 * `/learn/foundations/reference` (rework-proposal §3).
 *
 * This is the surface the old `/learn/foundations` tab bar was: five sibling
 * references (Pinyin, Tones, Strokes, Animations, Pictographs). It survives
 * intact and stays searchable/scan-able — but it is no longer the first-run
 * task. The Blueprint (`/learn/foundations`, wizard/Focus) is, and it links here
 * per step.
 *
 * Rework §1: the Pictographs tab is NOT locked. `lockedTabs` / `getLockPhase` /
 * "Complete Phase 2 to unlock" are gone — BM-1 L6 makes the roadmap signals,
 * not walls, and a lock that clicks through teaches the learner to distrust the
 * chrome. Phase survives as `data-phase` metadata only.
 *
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game).
 * Story 22.4 follow-up (Issue 4): active tab is URL-driven via
 * useSearchParamState — `?tab=` seeds the tab (URL wins over the `initialTab`
 * default), writes use replace so Back exits the page, and the param is omitted
 * when it matches the default (canonical URL).
 */
import {
  FOUNDATION_SECTIONS,
  FOUNDATION_SECTION_LABELS,
  type FoundationSectionId,
} from "@mandarin/shared-constants";
import { PageHeader, PageShell, PageStack, Tabs } from "shared/components";
import type { TabConfig } from "shared/components";
import { SEARCH_PARAMS } from "shared/constants";
import { useSearchParamState } from "shared/hooks";
import { PictographGallery, FoundationsProgressBar } from "features/foundations";
import { PinyinTab } from "./PinyinTab";
import { TonesTab } from "./TonesTab";
import { StrokeReferenceTab } from "./StrokeReferenceTab";
import { StrokeAnimationTab } from "./StrokeAnimationTab";

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

/** Whitelist of valid tab ids — anything else (or absent) falls back to the default. */
const TAB_IDS = new Set<string>(TABS_CONFIG.map((tab) => tab.id));

export function FoundationsReferencePage({
  initialTab = "pinyin",
}: {
  initialTab?: FoundationSectionId | "pictographs";
}) {
  // URL wins in prod (`?tab=tones`); `initialTab` is the story/default fallback.
  const [activeTab, setActiveTab] = useSearchParamState<string>(SEARCH_PARAMS.tab, {
    defaultValue: initialTab,
    parse: (raw) => (raw && TAB_IDS.has(raw) ? raw : null),
  });
  // Phase is sequencing metadata surfaced as progress, never as a lock.

  return (
    <PageShell archetype="reports">
      <PageStack size="default">
        <PageHeader
          title="Foundations Reference"
          description="Every initial, final, tone pair and stroke in one place. The guided path is the Blueprint."
        />
        <div className="flex-col">
          <Tabs tabs={TABS_CONFIG} activeTab={activeTab} onTabChange={setActiveTab} align="center">
            {activeTab === "pinyin" && <PinyinTab />}
            {activeTab === "tones" && <TonesTab />}
            {activeTab === "strokes" && <StrokeReferenceTab />}
            {activeTab === "animations" && <StrokeAnimationTab />}
            {activeTab === "pictographs" && <PictographGallery />}
          </Tabs>

          <FoundationsProgressBar />
        </div>
      </PageStack>
    </PageShell>
  );
}
