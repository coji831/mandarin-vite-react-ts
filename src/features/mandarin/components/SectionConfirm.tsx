/**
 * SectionConfirm component contract:
 *
 * - Receives a list of sections and wordsPerSection as props.
 * - Displays a summary of created sections and a proceed button.
 * - Pure presentational; does not manage persistence or parent state.
 */
/**
 * SectionConfirm component contract:
 *
 * - Receives a list of sections and wordsPerSection as props.
 * - Displays a summary of created sections and a proceed button.
 * - Pure presentational; does not manage persistence or parent state.
 */
import React from "react";

type Section = {
  sectionId: string;
  wordIds: string[];
};

type Props = {
  sections: Section[];
  wordsPerSection: number;
  onProceed: () => void;
};

export function SectionConfirm({
  sections,
  wordsPerSection,
  onProceed,
}: Props) {
  return (
    <div style={{ textAlign: "center", marginTop: 32 }}>
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
      <button onClick={onProceed} style={{ marginTop: 16 }}>
        Proceed
      </button>
    </div>
  );
}
