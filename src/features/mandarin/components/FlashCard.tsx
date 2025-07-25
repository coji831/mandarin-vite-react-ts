/**
 * FlashCard component contract:
 *
 * - The parent component is responsible for:
 *   - Loading the correct `sectionWords` array based on the selected section (each word must include character, pinyin, etc.).
 *   - Implementing `onMarkMastered(wordId)` to update localStorage for the word's progress (including `mastered`, `lastReviewed`, `reviewCount`, and `nextReview` for spaced repetition).
 *   - Passing `masteredWordIds` as a Set of mastered wordIds (from localStorage or other persistent storage).
 *   - Handling the `onBackToSection` callback for the "Return to Section Selection" button.
 *
 * This component only manages UI state (current card, search, show details) and delegates all persistence and data loading to the parent.
 */
/**
 * FlashCard component contract:
 *
 * - The parent component is responsible for:
 *   - Loading the correct `sectionWords` array based on the selected section (each word must include character, pinyin, etc.).
 *   - Implementing `onMarkMastered(wordId)` to update localStorage for the word's progress (including `mastered`, `lastReviewed`, `reviewCount`, and `nextReview` for spaced repetition).
 *   - Passing `masteredWordIds` as a Set of mastered wordIds (from localStorage or other persistent storage).
 *   - Handling the `onBackToSection` callback for the "Return to Section Selection" button.
 *
 * This component only manages UI state (current card, search, show details) and delegates all persistence and data loading to the parent.
 */
import { useState, useMemo } from "react";
import { PlayButton } from "./PlayButton";
import { WordDetails } from "./WordDetails";

export type Card = {
  wordId: string;
  character: string;
  pinyin: string;
  meaning: string;
  sentence: string;
  sentencePinyin: string;
  sentenceMeaning: string;
  mastered?: boolean;
  lastReviewed?: string;
  reviewCount?: number;
  nextReview?: string;
};

type FlashCardProps = {
  sectionWords: Card[];
  sectionProgress: { mastered: number; total: number };
  onMarkMastered: (wordId: string) => void;
  masteredWordIds: Set<string>;
  onBackToSection: () => void;
};

export function FlashCard({
  sectionWords,
  sectionProgress,
  onMarkMastered,
  masteredWordIds,
  onBackToSection,
}: FlashCardProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");

  // Filtered word list for sidebar
  const filteredWords = useMemo(() => {
    if (!search.trim()) return sectionWords;
    return sectionWords.filter(
      (w) =>
        w.character.includes(search.trim()) ||
        w.pinyin.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [search, sectionWords]);

  // If currentCardIndex is out of bounds after filtering, reset to 0
  if (currentCardIndex >= filteredWords.length && filteredWords.length > 0) {
    setCurrentCardIndex(0);
    return null;
  }

  const currentCard = filteredWords[currentCardIndex];

  const handlePrevious = () => {
    setCurrentCardIndex(
      (prev) => (prev - 1 + filteredWords.length) % filteredWords.length,
    );
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

  // Section complete?
  const sectionComplete = sectionProgress.mastered === sectionProgress.total;

  return (
    <div
      id="flashcard"
      className="flex  "
      style={{ width: "100%", minHeight: "100%" }}
    >
      <div
        className="  bg-dark flex  align-center"
        style={{
          width: "100%",
          minHeight: 600,
          position: "relative",
          justifyContent: "space-evenly",
        }}
      >
        {/* Sidebar - 30% */}
        <div
          className="flashcard-sidebar bg-dark flex-col"
          style={{
            width: "30%",
            color: "#fff",
            padding: 16,
            borderRight: "1px solid #333",
            boxShadow: "2px 0 8px 0 rgba(30,40,80,0.10)",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search character or pinyin"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #888",
                fontSize: 15,
                background: "#232a3a",
                color: "#fff",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>Section Progress:</strong>
            <div
              style={{
                marginTop: 4,
                marginBottom: 4,
                height: 12,
                background: "#38405a",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${
                    (sectionProgress.mastered / sectionProgress.total) * 100
                  }%`,
                  height: "100%",
                  background: "#4caf50",
                  transition: "width 0.3s cubic-bezier(.4,2,.6,1)",
                }}
              />
            </div>
            <span>
              {sectionProgress.mastered} / {sectionProgress.total} words
              mastered
            </span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto", flex: 1 }}>
            {filteredWords.map((w, idx) => (
              <div
                key={w.wordId}
                onClick={() => handleSidebarClick(idx)}
                style={{
                  padding: "8px 6px",
                  marginBottom: 2,
                  borderRadius: 4,
                  background: idx === currentCardIndex ? "#38405a" : undefined,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: masteredWordIds.has(w.wordId)
                    ? "1.5px solid #4caf50"
                    : "1px solid #444",
                }}
              >
                <span style={{ fontSize: 22 }}>{w.character}</span>
                <span style={{ fontSize: 14, color: "#b3c7ff" }}>
                  {w.pinyin}
                </span>
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
          <button
            style={{
              marginTop: 18,
              width: "100%",
              padding: "10px 0",
              background: "#646cff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
            }}
            onClick={onBackToSection}
          >
            Return to Section Selection
          </button>
        </div>

        {/* Flashcard Area - 40% */}
        <div
          className="flashcard-center flex flex-col flex-center"
          style={{
            width: "40%",
          }}
        >
          <div
            className="flashcard-card flex-col flex-center bg-card"
            style={{
              width: 420,
              minHeight: 420,
              borderRadius: 16,
              boxShadow: "0 2px 16px 0 rgba(30,40,80,0.13)",
              padding: "48px 36px 36px 36px",
              position: "relative",
              margin: 0,
              transition: "box-shadow 0.2s",
            }}
          >
            {currentCard ? (
              <>
                <div
                  style={{
                    fontSize: 100,
                    color: "#fff",
                    marginBottom: 18,
                    letterSpacing: 2,
                  }}
                >
                  {currentCard.character}
                </div>
                {/* Speak and Show Details Row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 18,
                    marginBottom: 28,
                    marginTop: 8,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <PlayButton mandarinText={currentCard.character} />
                  <button
                    onClick={() => setShowDetails((v) => !v)}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: showDetails ? "#232a3a" : "#007bff",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 17,
                      cursor: "pointer",
                      boxShadow: showDetails ? "0 0 0 2px #007bff" : undefined,
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {showDetails ? "Hide Details" : "Show Details"}
                  </button>
                </div>
                {/* Mastered Button Row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 18,
                    marginBottom: 24,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={() => onMarkMastered(currentCard.wordId)}
                    disabled={masteredWordIds.has(currentCard.wordId)}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: masteredWordIds.has(currentCard.wordId)
                        ? "#aaa"
                        : "#4caf50",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 17,
                      cursor: masteredWordIds.has(currentCard.wordId)
                        ? "not-allowed"
                        : "pointer",
                      minWidth: 140,
                      boxShadow: masteredWordIds.has(currentCard.wordId)
                        ? undefined
                        : "0 0 0 2px #4caf50",
                      transition: "background 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {masteredWordIds.has(currentCard.wordId)
                      ? "Mastered"
                      : "Mark as Mastered"}
                  </button>
                </div>
                {/* Navigation Buttons at bottom corners */}
                <div
                  style={{
                    position: "absolute",
                    left: 18,
                    bottom: 18,
                  }}
                >
                  <button
                    onClick={handlePrevious}
                    style={{
                      ...navBtnStyle,
                      fontSize: 16,
                      padding: "8px 18px",
                    }}
                  >
                    ◀ Previous
                  </button>
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 18,
                    bottom: 18,
                  }}
                >
                  <button
                    onClick={handleNext}
                    style={{
                      ...navBtnStyle,
                      fontSize: 16,
                      padding: "8px 18px",
                    }}
                  >
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
          className="flashcard-details flex-col"
          style={{
            width: "30%",
            background: showDetails && currentCard ? "#2a3145" : "transparent",
            borderRadius: showDetails && currentCard ? 16 : 0,
            boxShadow:
              showDetails && currentCard
                ? "0 2px 16px 0 rgba(30,40,80,0.10)"
                : undefined,
            padding: "36px 28px",
            marginLeft: 0,
            color: "#fff",
            fontSize: 17,
            position: "relative",
            minHeight: 420,
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

const navBtnStyle: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: 4,
  border: "none",
  background: "#646cff",
  color: "#fff",
  fontWeight: 500,
  cursor: "pointer",
};
