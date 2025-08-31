/**
 * SectionConfirm component
 *
 * - Confirms section creation for Mandarin learning flow.
 * - Uses context for all state (sections, dailyWordCount).
 * - Displays a summary of created sections and a proceed button.
 * - Navigation handled via callback prop.
 */
import React from "react";
import { useProgressContext } from "../context/ProgressContext";

type SectionConfirmProps = {
  onProceed: () => void;
};

export function SectionConfirm({ onProceed }: SectionConfirmProps) {
  const { sections, dailyWordCount } = useProgressContext();
  const wordsPerSection = dailyWordCount || 0;
  return (
    <div style={{ textAlign: "center" }}>
      <h2>Sections Created</h2>
      <p>
        {sections.length} sections created, {wordsPerSection} words per section
        {sections.length > 0 &&
        sections[sections.length - 1].wordIds.length !== wordsPerSection
          ? ` (last section: ${
              sections[sections.length - 1].wordIds.length
            } words)`
          : ""}
      </p>
      <button onClick={onProceed}>Proceed</button>
    </div>
  );
}
