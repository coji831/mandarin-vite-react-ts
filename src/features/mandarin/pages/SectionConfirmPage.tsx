/**
 * SectionConfirmPage
 * Standalone route component for confirming section creation in Mandarin feature.
 * Uses ProgressContext for state and React Router for navigation.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useMandarinContext } from "../context/useMandarinContext";

export function SectionConfirmPage() {
  const navigate = useNavigate();
  const { sections, dailyWordCount } = useMandarinContext();
  const wordsPerSection = dailyWordCount || 0;
  return (
    <div style={{ textAlign: "center" }}>
      <h2>Sections Created</h2>
      <p>
        {sections.length} sections created, {wordsPerSection} words per section
        {sections.length > 0 && sections[sections.length - 1].wordIds.length !== wordsPerSection
          ? ` (last section: ${sections[sections.length - 1].wordIds.length} words)`
          : ""}
      </p>
      <button onClick={() => navigate("/mandarin/section-select")}>Proceed</button>
    </div>
  );
}
