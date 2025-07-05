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
};
function Sidebar({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
}: Readonly<Props>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showMeaning, setShowMeaning] = useState(false);

  const filteredCards = cards.filter((card) =>
    [card.character, card.pinyin, card.meaning].some((field) =>
      field.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    ),
  );

  return (
    <div>
      <div>
        <h2>Word List</h2>
        <button onClick={() => setShowMeaning(!showMeaning)}>{`${
          showMeaning ? "Hide" : "Show"
        } meaning`}</button>
      </div>
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-evenly",
          gap: "5px",
        }}
      >
        {filteredCards.map((card, index) => {
          const originalIndex = cards.findIndex(
            (c) => c.character === card.character,
          );
          return (
            <button
              key={`${card.pinyin}-${index}`}
              style={{
                width: "25%",
                height: "120px",
                minHeight: "fit-content",
                backgroundColor:
                  currentCardIndex === originalIndex ? "#646cffaa" : undefined,
                padding: 0,
              }}
              onClick={() => setCurrentCardIndex(originalIndex)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0056b3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
            >
              <div style={characterStyle}>{card.character}</div>
              {showMeaning && <div style={pinyinStyle}>{card.pinyin}</div>}
              {showMeaning && <div style={meaningStyle}>{card.meaning}</div>}
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
  color: "#EEE",
  transition: "color 0.2s",
};
const pinyinStyle = { fontSize: "14px", color: "#555" };
const meaningStyle = { fontSize: "14px", color: "#777" };

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
