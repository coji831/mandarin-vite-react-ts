/**
 * SectionSelect component contract:
 *
 * - Receives a list of sections and selection state as props.
 * - Displays selectable sections and progress.
 * - Pure presentational; does not manage persistence or parent state.
 */
import React from "react";

type Section = {
  sectionId: string;
  wordIds: string[];
  progress: Record<string | number, any>;
};

type Props = {
  sections: Section[];
  selectedSectionId: string | null;
  setSelectedSectionId: (id: string) => void;
  onProceed: () => void;
  sectionProgress?: Record<string, number>;
  learnedWordIds?: string[];
  totalWords?: number;
  onBack?: () => void;
};

export function SectionSelect({
  sections,
  selectedSectionId,
  setSelectedSectionId,
  onProceed,
  sectionProgress = {},
  learnedWordIds = [],
  totalWords = 0,
  onBack,
}: Props) {
  const [showUncompletedOnly, setShowUncompletedOnly] = React.useState(false);
  // Calculate section progress
  const completedSections = sections.filter(
    (section) =>
      (sectionProgress[section.sectionId] || 0) >= section.wordIds.length,
  );
  const totalSections = sections.length;
  const filteredSections = showUncompletedOnly
    ? sections.filter(
        (section) =>
          (sectionProgress[section.sectionId] || 0) < section.wordIds.length,
      )
    : sections;

  return (
    <div style={{ textAlign: "center", marginTop: 32 }}>
      <h2>Select a Section to Study</h2>
      <div style={{ marginBottom: 8 }}>
        <strong>Sections Completed:</strong> {completedSections.length} /{" "}
        {totalSections}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Overall Progress:</strong> {learnedWordIds.length} /{" "}
        {totalWords} words learned
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {filteredSections.map((section) => {
          const isCompleted =
            (sectionProgress[section.sectionId] || 0) >= section.wordIds.length;
          return (
            <div
              key={section.sectionId}
              style={{
                margin: 8,
                padding: 0,
                border:
                  selectedSectionId === section.sectionId
                    ? "2px solid #8faaff"
                    : "1px solid #222a3a",
                background:
                  selectedSectionId === section.sectionId
                    ? "#222a3a"
                    : "#38405a",
                borderRadius: 10,
                minWidth: 120,
                minHeight: 80,
                boxShadow: "0 2px 8px 0 rgba(30,40,80,0.10)",
                cursor: isCompleted ? "not-allowed" : "pointer",
                transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
                color:
                  selectedSectionId === section.sectionId ? "#fff" : "#e0e7ff",
                outline: "none",
                opacity: isCompleted ? 0.6 : 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() =>
                !isCompleted && setSelectedSectionId(section.sectionId)
              }
              onMouseOver={(e) => {
                (e.currentTarget as unknown as HTMLDivElement).style.boxShadow =
                  "0 6px 20px 0 rgba(100,108,255,0.13)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as unknown as HTMLDivElement).style.boxShadow =
                  selectedSectionId === section.sectionId
                    ? "0 4px 16px 0 rgba(100,108,255,0.10)"
                    : "0 2px 8px 0 rgba(60,60,60,0.06)";
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  marginBottom: 6,
                  color:
                    selectedSectionId === section.sectionId
                      ? "#fff"
                      : "#e0e7ff",
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
                  color:
                    selectedSectionId === section.sectionId
                      ? "#fff"
                      : "#e0e7ff",
                }}
              >
                {section.wordIds.length} words
              </div>
              <div
                style={{
                  fontSize: 14,
                  color:
                    selectedSectionId === section.sectionId
                      ? "#ffe066"
                      : "#b3c7ff",
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                Progress: {sectionProgress[section.sectionId] || 0} /{" "}
                {section.wordIds.length}
              </div>
              {isCompleted && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 12,
                    color: "#ffe066",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  ✓ Completed
                </div>
              )}
              <button
                style={{
                  marginTop: 12,
                  padding: "8px 20px",
                  background: isCompleted ? "#aaa" : "#646cff",
                  color: isCompleted ? "#eee" : "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: isCompleted ? "not-allowed" : "pointer",
                  opacity: isCompleted ? 0.7 : 1,
                  transition: "background 0.18s cubic-bezier(.4,0,.2,1)",
                }}
                disabled={isCompleted}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isCompleted) {
                    setSelectedSectionId(section.sectionId);
                    onProceed();
                  }
                }}
              >
                {sectionProgress[section.sectionId] > 0 && !isCompleted
                  ? "Continue Flashcards"
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
