/**
 * Sidebar component
 *
 * - Displays a list of vocabulary cards for navigation.
 * - Allows selecting a card, and optionally shows pinyin/meaning.
 * - Pure presentational; does not manage persistence or parent state.
 * - Supports filtering and highlights the current card.
 */
import { CSSProperties, useState } from "react";

export { Sidebar };

type SidebarCard = {
  character: string;
  pinyin: string;
  meaning: string;
};

type Props = {
  cards: SidebarCard[];
  setCurrentCardIndex: (index: number) => void;
  currentCardIndex: number;
  showPinyin?: boolean;
  showMeaning?: boolean;
};
function Sidebar({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
  showPinyin,
  showMeaning,
}: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = cards.filter((card) =>
    [card.character, card.pinyin, card.meaning].some((field) =>
      field.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    ),
  );

  return (
    <div>
      <h2>Word List</h2>

      <div className="flex gap-10" style={{ flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search vocab..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "#007bff")}
          onBlur={(e) => (e.target.style.borderColor = "#ccc")}
        />
        {filteredCards.length === 0 && <NoResults />}
        {filteredCards.map((card, index) => {
          const originalIndex = cards.findIndex(
            (c) => c.character === card.character,
          );
          const isCurrentCard = currentCardIndex === originalIndex;
          return (
            <button
              key={`${card.pinyin}-${index}`}
              style={{
                width: "100%",
                height: "120px",
                minHeight: "fit-content",
                backgroundColor: isCurrentCard
                  ? "rgba(100, 108, 255, 0.77)"
                  : undefined,
                padding: 0,
              }}
              onClick={() => setCurrentCardIndex(originalIndex)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0056b3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
            >
              <div
                style={{
                  ...characterStyle,
                  color: isCurrentCard
                    ? "rgba(0, 0, 0, 1)"
                    : "rgba(255, 255, 255, 1)",
                }}
              >
                {card.character}
              </div>
              {showPinyin && (
                <div
                  style={{
                    fontSize: "14px",
                    transition: "color 0.2s",
                    color: isCurrentCard
                      ? "rgba(0, 0, 0, .8)"
                      : "rgba(255, 255, 255, .8)",
                  }}
                >
                  {card.pinyin}
                </div>
              )}
              {showMeaning && (
                <div
                  style={{
                    fontSize: "14px",
                    transition: "color 0.2s",
                    color: isCurrentCard
                      ? "rgba(0, 0, 0, .6)"
                      : "rgba(255, 255, 255, .6)",
                  }}
                >
                  {card.meaning}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const NoResults = () => (
  <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
    No results found
  </div>
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
