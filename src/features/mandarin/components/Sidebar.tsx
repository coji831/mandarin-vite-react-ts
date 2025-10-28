/**
 * Sidebar component
 *
 * - Displays a list of vocabulary cards for navigation.
 * - Uses ProgressContext for word state and progress.
 * - Highlights mastered words and shows list progress.
 * - Filtering and selection handled via props.
 * - Story 4-8: Updated for route-based navigation.
 */
import React from "react";
import { useProgressState } from "../hooks";
import { Card } from "../types";
import { RootState } from "../reducers/rootReducer";

export { Sidebar };

type Props = {
  currentCardIndex: number;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  filteredWords: Card[];
  handleSidebarClick: (_idx: number) => void;
  onBackToList: () => void;
};
function Sidebar({
  currentCardIndex,
  search,
  setSearch,
  filteredWords,
  handleSidebarClick,
  onBackToList,
}: Readonly<Props>) {
  // Use selector hook to read only the needed slices
  const masteredProgress = useProgressState((s: RootState) => s.ui.masteredProgress ?? {});
  const selectedList = useProgressState((s: RootState) => s.ui.selectedList ?? null);
  const masteredWordIds =
    selectedList && masteredProgress[selectedList]
      ? masteredProgress[selectedList]
      : new Set<string>();
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
        <strong>List Progress:</strong>
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
      <button style={{ width: "100%" }} onClick={onBackToList}>
        Return to Vocabulary List
      </button>
    </div>
  );
}

// helper styles removed — unused in current implementation
