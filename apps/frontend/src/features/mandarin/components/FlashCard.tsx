/**
 * FlashCard component
 *
 * - Displays flashcards for a vocabulary list in the Mandarin feature.
 * - Uses ProgressContext for word state, progress, and actions.
 * - All navigation (next/prev, sidebar, return to vocabulary list) is context-driven and route-based.
 * - No legacy state-driven navigation remains; return to vocabulary list is handled by parent page using React Router.
 * - Includes search/filter, progress bar, and details panel.
 * - Fully migrated for Story 4-8: route-based navigation and context usage only.
 * - Follows project conventions in docs/guides/conventions.md.
 */

import { useMemo, useState } from "react";

import { useProgressActions, useProgressState } from "../hooks";
import { RootState } from "../reducers";
import { WordBasic } from "../types";
import { PlayButton } from "./PlayButton";
import { Sidebar } from "./Sidebar";
import { WordDetails } from "./WordDetails";

type FlashCardProps = {
  words: WordBasic[];
  listId: string;
  onBackToList: () => void;
};

export function FlashCard({ words, onBackToList }: FlashCardProps) {
  // Select only the parts of progress state this component needs to avoid re-renders
  // Story 13.4: Single source - progress reducer (backend, binary mastery)
  const progressState = useProgressState((s: RootState) => s.progress?.wordsById ?? {});
  const { markWordLearned, unmarkWordLearned } = useProgressActions();
  const [toggleError, setToggleError] = useState<string | null>(null);

  const cards = words.map(mapToCard);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");

  // Navigation handlers
  const handleSidebarClick = (index: number) => {
    setShowDetails(false);
    setCurrentCardIndex(index);
  };
  const handlePrevious = () => setCurrentCardIndex((i) => (i > 0 ? i - 1 : i));
  const handleNext = () => setCurrentCardIndex((i) => (i < filteredWords.length - 1 ? i + 1 : i));
  const filteredWords = useMemo(() => {
    if (!search.trim()) return cards;
    return cards.filter(
      (w) =>
        (w.character && w.character.includes(search.trim())) ||
        (w.pinyin && w.pinyin.toLowerCase().includes(search.trim().toLowerCase()))
    );
  }, [search, cards]);

  // If currentCardIndex is out of bounds after filtering, reset to 0
  if (currentCardIndex >= filteredWords.length && filteredWords.length > 0) {
    setCurrentCardIndex(0);
    return null;
  }

  // Mastery logic: compute from progressState
  // Binary check - record exists = mastered (confidence always 1.0)
  const masteredWords = new Set<string>();
  words.forEach((w) => {
    if (progressState[w.wordId]) {
      // Just check if record exists
      masteredWords.add(w.wordId);
    }
  });
  const mastered = masteredWords.size;
  const percent = words.length === 0 ? 0 : Math.round((mastered / words.length) * 100);

  const currentCard = filteredWords[currentCardIndex];

  return (
    <div className="flashcard-layout flex" style={{ width: "100%", height: "100%" }}>
      <Sidebar
        filteredWords={filteredWords}
        currentCardIndex={currentCardIndex}
        search={search}
        setSearch={setSearch}
        handleSidebarClick={handleSidebarClick}
        onBackToList={onBackToList}
      />
      {/* Flashcard Area - 40% */}
      <div className="flashcard-center flex flex-col" style={{ width: "40%" }}>
        <div
          className="flashcard-card flex flex-col padding-10"
          style={{
            height: "100%",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {currentCard ? (
            <>
              <div
                style={{
                  fontSize: 100,
                  color: "#ffffff",
                  letterSpacing: 2,
                }}
              >
                {currentCard.character}
              </div>
              <div style={{ color: "#b3c7ff", marginTop: 8 }}>{percent}% mastered</div>
              {/* Speak and Show Details Row */}
              <div
                className="flex"
                style={{
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-evenly",
                }}
              >
                <PlayButton mandarinText={currentCard.character} />
                <button
                  onClick={() => setShowDetails((v) => !v)}
                  style={{
                    boxShadow: showDetails ? "0 0 0 2px #007bff" : undefined,
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>
              {/* Mastered Button Row */}
              <div
                className="flex flex-center"
                style={{ width: "100%", flexDirection: "column", gap: "8px" }}
              >
                <button
                  onClick={async () => {
                    try {
                      setToggleError(null);
                      if (masteredWords.has(currentCard.wordId)) {
                        await unmarkWordLearned(currentCard.wordId);
                      } else {
                        await markWordLearned(currentCard.wordId);
                      }
                    } catch (error) {
                      console.error("Failed to toggle mastery:", error);
                      setToggleError("Failed to update progress. Please try again.");
                    }
                  }}
                  style={{
                    background: masteredWords.has(currentCard.wordId) ? "#4caf50" : "#38405aff",
                    color: "#ffffff",
                    minWidth: 140,
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}
                >
                  {masteredWords.has(currentCard.wordId) ? "Mastered ✓" : "Mark as Mastered"}
                </button>
                {toggleError && (
                  <span style={{ color: "#ff6b6b", fontSize: 14 }}>{toggleError}</span>
                )}
              </div>
              {/* Navigation Buttons at bottom corners */}
              <div className="flex" style={{ width: "100%", justifyContent: "space-around" }}>
                <button type="button" onClick={handlePrevious}>
                  ◀ Previous
                </button>
                <button type="button" onClick={handleNext}>
                  Next ▶
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: "#fff" }}>No words found.</div>
          )}
        </div>
      </div>
      {/* Details/Meaning Panel - 30% */}
      <div
        className="flashcard-details flex flex-col"
        style={{
          width: "30%",
          background: showDetails && currentCard ? "#2a3145" : "transparent",
          borderRadius: showDetails && currentCard ? 16 : 0,
          padding: "36px",
          color: "#ffffff",
          fontSize: 17,
          minHeight: "100%",
        }}
      >
        {showDetails && currentCard && (
          <WordDetails
            wordId={currentCard.wordId}
            chinese={currentCard.character}
            pinyin={currentCard.pinyin}
            english={currentCard.meaning}
          />
        )}
      </div>
    </div>
  );
}

// Map WordBasic[] to UI card shape (no sentence fields)
const mapToCard = (w: WordBasic) => ({
  wordId: w.wordId,
  character: w.chinese || "",
  pinyin: w.pinyin || "",
  meaning: w.english || "",
});
