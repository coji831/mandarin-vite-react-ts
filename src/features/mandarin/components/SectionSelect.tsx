/**
 * SectionSelect component
 *
 * - Organizes and displays selectable sections for Mandarin learning flow.
 * - Uses ProgressContext for sections, selection, and progress.
 * - Allows filtering to show only uncompleted sections.
 * - Navigation handled via callback props.
 */
import React from "react";
import { useProgressContext } from "../context/ProgressContext";
import { Section } from "../types";

type SectionSelectProps = {
  onProceed: () => void;
  onBack?: () => void;
};

export function SectionSelect({ onProceed, onBack }: SectionSelectProps) {
  const {
    sections,
    selectedSectionId,
    setSelectedSectionId,
    sectionProgress = {},
    learnedWordIds = [],
    selectedWords = [],
  } = useProgressContext();
  const totalWords = selectedWords.length;
  const [showUncompletedOnly, setShowUncompletedOnly] = React.useState(false);
  // Calculate section progress
  const completedSections = sections.filter(
    (section: Section) =>
      (sectionProgress[section.sectionId] || 0) >= section.wordIds.length,
  );
  const totalSections = sections.length;
  const filteredSections = showUncompletedOnly
    ? sections.filter(
        (section: Section) =>
          (sectionProgress[section.sectionId] || 0) < section.wordIds.length,
      )
    : sections;

  return (
    <div style={{ textAlign: "center", marginTop: 32 }}>
      <h2>Select a Section to Study</h2>
      <div style={{ marginBottom: 8 }}>
        <strong>Sections Completed: </strong>
        {completedSections.length} / {totalSections}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Overall Progress: </strong>
        {learnedWordIds.length} / {totalWords} words learned
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 15 }}>
          <input
            type="checkbox"
            checked={showUncompletedOnly}
            onChange={() => setShowUncompletedOnly((v) => !v)}
            style={{ marginRight: 8 }}
          />
          Show uncompleted sections only
        </label>
      </div>
      <div className="flex gap-10 flex-center" style={{ flexWrap: "wrap" }}>
        {filteredSections.map((section: Section) => {
          const isSelected = selectedSectionId === section.sectionId;
          const isCompleted =
            (sectionProgress[section.sectionId] || 0) >= section.wordIds.length;
          return (
            <div
              className="flex flex-col flex-center padding-10"
              key={section.sectionId}
              style={{
                border: isSelected ? "2px solid #8faaff" : "1px solid #222a3a",
                background: isSelected ? "#222a3a" : "#38405a",
                borderRadius: 10,
                boxShadow: "0 2px 8px 0 rgba(30,40,80,0.10)",
                transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
                color: isSelected ? "#fff" : "#e0e7ff",
                opacity: isCompleted ? 0.6 : 1,
              }}
              onClick={() => setSelectedSectionId(section.sectionId)}
              onMouseOver={(e) => {
                (e.currentTarget as unknown as HTMLDivElement).style.boxShadow =
                  "0 6px 20px 0 rgba(100,108,255,0.13)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as unknown as HTMLDivElement).style.boxShadow =
                  isSelected
                    ? "0 4px 16px 0 rgba(100,108,255,0.10)"
                    : "0 2px 8px 0 rgba(60,60,60,0.06)";
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: isSelected ? "#fff" : "#e0e7ff",
                }}
              >
                Section {section.sectionId.replace("section_", "")}: Words{" "}
                {section.wordIds.length > 0
                  ? `${section.wordIds[0]}–${
                      section.wordIds[section.wordIds.length - 1]
                    }`
                  : "-"}
              </div>

              <div
                style={{
                  fontSize: 15,
                  marginBottom: 4,
                  color: isSelected ? "#fff" : "#e0e7ff",
                }}
              >
                {section.wordIds.length} words
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: isSelected ? "#ffe066" : "#b3c7ff",
                  fontWeight: 500,
                }}
              >
                {isCompleted
                  ? "✓ Completed"
                  : `Progress: ${sectionProgress[section.sectionId] || 0} / ${
                      section.wordIds.length
                    }`}
              </div>

              <button
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  background: "#646cff",
                  color: isCompleted ? "#eee" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 15,
                  //opacity: isCompleted ? 0.7 : 1,
                  transition: "background 0.18s cubic-bezier(.4,0,.2,1)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSectionId(section.sectionId);
                  onProceed();
                }}
              >
                {sectionProgress[section.sectionId] > 0 && isCompleted
                  ? "Review"
                  : "Start Learning"}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24 }}>
        <button
          style={{ marginRight: 16, padding: "12px 32px" }}
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </div>
  );
}
