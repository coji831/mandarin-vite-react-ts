/**
 * SectionSelectPage
 * Standalone route component for selecting a section in Mandarin feature.
 * Uses ProgressContext for state and React Router for navigation.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useProgressContext } from "../context/ProgressContext";
import { Section } from "../types";

export function SectionSelectPage() {
  const navigate = useNavigate();
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
  const completedSections = sections.filter(
    (section: Section) => (sectionProgress[section.sectionId] || 0) >= section.wordIds.length
  );
  const totalSections = sections.length;
  const filteredSections = showUncompletedOnly
    ? sections.filter(
        (section: Section) => (sectionProgress[section.sectionId] || 0) < section.wordIds.length
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
          Show only uncompleted sections
        </label>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredSections.map((section: Section) => (
          <li key={section.sectionId} style={{ marginBottom: 12 }}>
            <button
              style={{
                fontWeight: selectedSectionId === section.sectionId ? "bold" : undefined,
                background: selectedSectionId === section.sectionId ? "#e0e0e0" : undefined,
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
              onClick={() => setSelectedSectionId(section.sectionId)}
            >
              Section {section.sectionId}
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => navigate("/mandarin/flashcards/" + selectedSectionId)}
          disabled={!selectedSectionId}
        >
          Start Flashcards
        </button>
      </div>
    </div>
  );
}
