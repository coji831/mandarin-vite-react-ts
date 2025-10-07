/**
 * Sidebar component
 *
 * - Displays a list of vocabulary cards for navigation.
 * - Uses ProgressContext for section/word state and progress.
 * - Highlights mastered words and shows section progress.
 * - Filtering and selection handled via props.
 * - Story 4-8: Updated for route-based navigation.
 */
import { CSSProperties } from "react";
import { useProgressContext } from "../context/ProgressContext";
import { Card, Word } from "../types";

export { Sidebar };

type Props = {
  currentCardIndex: number;
  search: string;
  setSearch: (value: string) => void;
  filteredWords: Card[];
  handleSidebarClick: (idx: number) => void;
  onBackToSection: () => void;
  masteredWordIds: Set<string>;
};
function Sidebar({
  currentCardIndex,
  search,
  setSearch,
  filteredWords,
  handleSidebarClick,
  onBackToSection,
  masteredWordIds,
}: Readonly<Props>) {
  // List-based progress: count mastered words in filteredWords
  const mastered = filteredWords.filter((w) => masteredWordIds.has(w.wordId)).length;
  const total = filteredWords.length;
  return (
    <div className="flashcard-sidebar flex flex-col padding-10 gap-10" style={{ width: "30%" }}>
      <div>
        <input
          type="text"
          placeholder="Search character or pinyin"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            boxSizing: "border-box",
            width: "100%",
            padding: 8,
            border: "2px solid #888888",
            borderRadius: 6,
            fontSize: 15,
            background: "#232a3a",
          }}
        />
      </div>
      <div
        className="flex flex-col gap-10"
        style={{ border: "2px solid #888888", borderRadius: 6 }}
      >
        <strong>Section Progress:</strong>
        <div
          style={{
            height: 12,
            background: "#38405a",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(mastered / total) * 100}%`,
              height: "100%",
              background: "#4caf50",
              transition: "width 0.3s cubic-bezier(.4,2,.6,1)",
            }}
          />
        </div>
        <span>
          {mastered} / {total} words mastered
        </span>
      </div>
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          flex: 1,
          border: "2px solid #888888",
          borderRadius: 6,
        }}
      >
        {filteredWords.map((w: Card, idx: number) => (
          <div
            className="flex padding-10 gap-10"
            key={w.wordId}
            onClick={() => handleSidebarClick(idx)}
            style={{
              borderRadius: 4,
              background: idx === currentCardIndex ? "#38405a" : undefined,
              cursor: "pointer",
              alignItems: "center",
              justifyContent: "space-between",
              border: masteredWordIds.has(w.wordId) ? "1.5px solid #4caf50" : "1px solid #444",
            }}
          >
            <span style={{ fontSize: 22 }}>{w.character}</span>
            <span style={{ fontSize: 14, color: "#b3c7ff" }}>{w.pinyin}</span>
            {masteredWordIds.has(w.wordId) && (
              <span
                title="Mastered"
                style={{
                  color: "#4caf50",
                  fontSize: 18,
                  marginLeft: "auto",
                }}
              >
                ✔
              </span>
            )}
          </div>
        ))}
      </div>
      <button style={{ width: "100%" }} onClick={onBackToSection}>
        Return to Section Selection
      </button>
    </div>
  );
}

const NoResults = () => (
  <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>No results found</div>
);

const characterStyle: CSSProperties = {
  textAlign: "center",
  fontSize: "16px",
  fontWeight: "bold",
  transition: "color 0.2s",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginBottom: "15px",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#fff",
  color: "#333",
};
