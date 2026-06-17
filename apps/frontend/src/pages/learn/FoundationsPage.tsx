/**
 * @file FoundationsPage.tsx
 * @description Main Foundations page with 4 sub-tabs (Pinyin, Tones, Strokes, Animations)
 * Story 18.1: Foundations Page Structure
 */
import { useState } from "react";
import {
  FOUNDATION_SECTIONS,
  FOUNDATION_SECTION_LABELS,
  type FoundationSectionId,
} from "@mandarin/shared-constants";
import { FoundationsProgressBar } from "../../features/foundations/components/FoundationsProgressBar";
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

export function FoundationsPage() {
  const [activeTab, setActiveTab] = useState<FoundationSectionId>("pinyin");

  return (
    <div className="foundations-page">
      <div className="foundations-tab-bar">
        {FOUNDATION_SECTIONS.map((id) => (
          <div
            key={id}
            className={`foundations-tab ${activeTab === id ? "foundations-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
            role="tab"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveTab(id);
            }}
          >
            <span className="foundations-tab-icon">{SECTION_ICONS[id]}</span>
            <span className="foundations-tab-label">{FOUNDATION_SECTION_LABELS[id]}</span>
          </div>
        ))}
      </div>

      <div className="foundations-tab-content" role="tabpanel">
        {activeTab === "pinyin" && <PinyinTab />}
        {activeTab === "tones" && <TonesTab />}
        {activeTab === "strokes" && <StrokeReferenceTab />}
        {activeTab === "animations" && <StrokeAnimationTab />}
      </div>

      <FoundationsProgressBar />
    </div>
  );
}
