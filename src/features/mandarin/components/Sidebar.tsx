import { useState } from "react";

export { Sidebar };

type SidebarCard = {
  character: string;
  pinyin: string;
  meaning: string;
};

function Sidebar({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
}: {
  cards: SidebarCard[];
  setCurrentCardIndex: (index: number) => void;
  currentCardIndex: number;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCards = cards.filter((card) =>
    [card.character, card.pinyin, card.meaning].some((field) =>
      field.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    ),
  );

  return (
    <div
      style={{
        width: "200px",
        background: "transparent",
        padding: "15px",
        borderRight: "1px solid #ddd",
        height: "70vh",
        overflowY: "auto",
      }}
    >
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "15px",
          color: "#333",
        }}
      >
        Vocab List
      </h2>
      <input
        type="text"
        placeholder="Search vocab..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
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
        }}
        onFocus={(e) => (e.target.style.borderColor = "#007bff")}
        onBlur={(e) => (e.target.style.borderColor = "#ccc")}
      />
      {filteredCards.length === 0 ? (
        <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
          No results found
        </div>
      ) : (
        filteredCards.map((card, index) => {
          const originalIndex = cards.findIndex(
            (c) => c.character === card.character,
          );
          return (
            <button
              key={`${card.pinyin}-${index}`}
              style={{
                width: "100%",
              }}
              onClick={() => setCurrentCardIndex(originalIndex)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0056b3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#333",
                  transition: "color 0.2s",
                }}
              >
                {card.character}
              </div>
              <div style={{ fontSize: "14px", color: "#555" }}>
                {card.pinyin}
              </div>
              <div style={{ fontSize: "14px", color: "#777" }}>
                {card.meaning}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
