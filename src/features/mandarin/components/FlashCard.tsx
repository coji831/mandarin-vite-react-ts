/**
 * FlashCard component
 *
 * - Displays flashcards for a section of words in the Mandarin feature.
 * - Uses ProgressContext for section/word state, progress, and actions.
 * - All navigation (next/prev, sidebar, return to section) is context-driven and route-based.
 * - No legacy state-driven navigation remains; return to section is handled by parent page using React Router.
 * - Includes search/filter, progress bar, and details panel.
 * - Fully migrated for Story 4-8: route-based navigation and context usage only.
 * - Follows project conventions in docs/guides/conventions.md.
 */
import { useMemo, useState } from "react";
import { useProgressContext } from "../context/ProgressContext";
import { Card } from "../types";
import { PlayButton } from "./PlayButton";
import { Sidebar } from "./Sidebar";
import { WordDetails } from "./WordDetails";

type FlashCardProps = {
  onBackToSection: () => void;
};

export function FlashCard({ onBackToSection }: FlashCardProps) {
  const {
    selectedSectionId,
    sections,
    selectedWords,
    learnedWordIds,
    sectionProgress,
    markWordLearned,
  } = useProgressContext();
  // Get current section and words from context
  const selectedSection = sections.find((s) => s.sectionId === selectedSectionId);
  const sectionWordIds = selectedSection ? selectedSection.wordIds : [];
  const sectionWords = selectedWords.filter((w: any) => sectionWordIds.includes(String(w.wordId)));
  const masteredWordIds = new Set(learnedWordIds);
  const mastered = sectionProgress[selectedSectionId || ""] || 0;
  const total = sectionWords.length;

  // Navigation state (local)
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");

  // Filtered word list for sidebar
  const filteredWords = useMemo(() => {
    if (!search.trim()) return sectionWords;
    return sectionWords.filter(
      (w: Card) =>
        w.character.includes(search.trim()) ||
        w.pinyin.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search, sectionWords]);

  // If currentCardIndex is out of bounds after filtering, reset to 0
  if (currentCardIndex >= filteredWords.length && filteredWords.length > 0) {
    setCurrentCardIndex(0);
    return null;
  }

  const currentCard = filteredWords[currentCardIndex];

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentCardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    setShowDetails(false);
  };
  const handleNext = () => {
    setCurrentCardIndex((prev) => (prev + 1) % filteredWords.length);
    setShowDetails(false);
  };
  const handleSidebarClick = (idx: number) => {
    setCurrentCardIndex(idx);
    setShowDetails(false);
  };

  return (
    <div>
      <div id="flashcard" className="flex" style={{ width: "100%", minHeight: "100%" }}>
        {/* Sidebar - 30% */}

        <Sidebar
          currentCardIndex={currentCardIndex}
          filteredWords={filteredWords}
          masteredWordIds={masteredWordIds}
          search={search}
          setSearch={setSearch}
          handleSidebarClick={handleSidebarClick}
          onBackToSection={onBackToSection}
        />
        {/* Flashcard Area - 40% */}
        <div className="flashcard-center flex flex-col  " style={{ width: "40%" }}>
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
                <div className="flex flex-center" style={{ width: "100%" }}>
                  <button
                    onClick={() => markWordLearned(currentCard.wordId)}
                    disabled={masteredWordIds.has(currentCard.wordId)}
                    style={{
                      background: masteredWordIds.has(currentCard.wordId) ? "#aaaaaa" : "#38405aff",
                      color: "#ffffff",
                      minWidth: 140,
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {masteredWordIds.has(currentCard.wordId) ? "Mastered" : "Mark as Mastered"}
                  </button>
                </div>
                {/* Navigation Buttons at bottom corners */}
                <div className=" flex " style={{ width: "100%", justifyContent: "space-around" }}>
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
          {showDetails && currentCard ? (
            <>
              <WordDetails {...currentCard} />
              {/* Speak Example Sentence Button, styled and separated */}
              <div
                style={{
                  width: "100%",
                  marginTop: 28,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <PlayButton mandarinText={currentCard.sentence} />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
