/**
 * SectionSelectPage
 *
 * - Standalone route component for selecting a section in the Mandarin feature.
 * - Uses ProgressContext for all state and selection logic.
 * - Uses React Router for all navigation (route-based, not state-based).
 * - UI uses card-style layout for section selection, matching legacy component for better UX.
 * - Includes router-based Back button for navigation to previous page.
 * - Fully migrated for Story 4-7: all navigation is context- and router-based, no legacy state-driven navigation remains.
 * - Follows project conventions in docs/guides/conventions.md.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useMandarinContext } from "../context/useMandarinContext";
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
  } = useMandarinContext();
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
      {/* Card-style section selection */}
      <div
        className="flex gap-10 flex-center"
        style={{ flexWrap: "wrap", justifyContent: "center", margin: "32px 0" }}
      >
        {filteredSections.map((section: Section) => {
          const isSelected = selectedSectionId === section.sectionId;
          const isCompleted = (sectionProgress[section.sectionId] || 0) >= section.wordIds.length;
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
                margin: 12,
                minWidth: 220,
                minHeight: 120,
                cursor: "pointer",
              }}
              onClick={() => setSelectedSectionId(section.sectionId)}
            >
              <div
                style={{ fontWeight: 700, fontSize: 18, color: isSelected ? "#fff" : "#e0e7ff" }}
              >
                Section {section.sectionId.replace("section_", "")}
              </div>
              <div
                style={{ fontSize: 15, marginBottom: 4, color: isSelected ? "#fff" : "#e0e7ff" }}
              >
                {section.wordIds.length} words
              </div>
              <div
                style={{ fontSize: 14, color: isSelected ? "#ffe066" : "#b3c7ff", fontWeight: 500 }}
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
                  transition: "background 0.18s cubic-bezier(.4,0,.2,1)",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSectionId(section.sectionId);
                  navigate("/mandarin/flashcards/" + section.sectionId);
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
      <div style={{ marginTop: 32 }}>
        <button
          style={{
            padding: "12px 32px",
            fontSize: 16,
            borderRadius: 6,
            background: "#eee",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}
