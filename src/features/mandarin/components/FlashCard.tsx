import { useState, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { AddForm } from "./AddForm";
import { WordDetails } from "./WordDetails";

export { FlashcardPage as FlashCard, type Card };

type Card = {
  character: string;
  pinyin: string;
  meaning: string;
  sentence: string;
  sentencePinyin: string;
  sentenceMeaning: string;
};

const FlashcardPage = ({
  cards,
  setCurrentCardIndex,
  currentCardIndex,
  isSidePanelOpen,
  toggleSidePanel,
  addCard,
}: {
  cards: Card[];
  setCurrentCardIndex: (index: number) => void;
  currentCardIndex: number;
  isSidePanelOpen: boolean;
  toggleSidePanel: () => void;
  addCard: (card: Card | Card[]) => void;
}) => {
  const [showMeaning, setShowMeaning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    character: "",
    pinyin: "",
    meaning: "",
    sentence: "",
    sentencePinyin: "",
    sentenceMeaning: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playAudio = (text: string | undefined) => {
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      speechSynthesis.speak(utterance);
    }
  };

  const handlePrevious = () => {
    setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
    setShowMeaning(false);
  };

  const handleNext = () => {
    setCurrentCardIndex((currentCardIndex + 1) % cards.length);
    setShowMeaning(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields are non-empty
    if (
      newCard.character &&
      newCard.pinyin &&
      newCard.meaning &&
      newCard.sentence &&
      newCard.sentencePinyin &&
      newCard.sentenceMeaning
    ) {
      addCard(newCard);
      setNewCard({
        character: "",
        pinyin: "",
        meaning: "",
        sentence: "",
        sentencePinyin: "",
        sentenceMeaning: "",
      });
      setShowAddForm(false);
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (Array.isArray(json)) {
            const validCards = json.filter(
              (card) =>
                card.character &&
                card.pinyin &&
                card.meaning &&
                card.sentence &&
                card.sentencePinyin &&
                card.sentenceMeaning,
            );
            if (validCards.length > 0) {
              addCard(validCards);
            } else {
              alert("No valid cards found in JSON.");
            }
          } else {
            alert("Invalid JSON format. Expected an array of cards.");
          }
        } catch (error) {
          alert("Error parsing JSON file.");
        }
        // Reset file input
        e.target.value = "";
      };
      reader.readAsText(file);
    }
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div
      id="flashcard"
      className="container"
      style={{ display: "flex", width: "100%" }}
    >
      <div className="container" style={{ width: "30%" }}>
        {isSidePanelOpen && (
          <Sidebar
            cards={cards}
            setCurrentCardIndex={setCurrentCardIndex}
            currentCardIndex={currentCardIndex}
          />
        )}
      </div>
      <div
        className="container"
        style={{
          width: "40%",
          gap: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* button group */}
        <div
          className="container"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          <button onClick={toggleSidePanel}>
            {isSidePanelOpen ? "Hide Panel" : "Show Panel"}
          </button>
          <button onClick={() => setShowAddForm(true)}>Add Word</button>
          <button onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </div>

        {/* Add Form or Flashcard Content */}

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "52px", marginBottom: "20px" }}>
            {currentCard.character}
          </div>

          <div style={rowStyle}>
            <button onClick={() => playAudio(currentCard.character)}>
              {`Play Character`}
            </button>
            <button onClick={() => playAudio(currentCard.sentence)}>
              {`Play Sentence`}
            </button>

            <button onClick={() => setShowMeaning(!showMeaning)}>
              {showMeaning ? "Hide" : "Show"} Details
            </button>
          </div>

          <div style={rowStyle}>
            <button onClick={handlePrevious}>Previous</button>
            <button onClick={handleNext}>Next</button>
          </div>

          {showMeaning && <WordDetails {...currentCard} />}
        </div>
      </div>

      <div className="container" style={{ width: "30%" }}>
        {showAddForm && (
          <AddForm addCard={addCard} onCancel={() => setShowAddForm(false)} />
        )}
      </div>
    </div>
  );
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  gap: "10px",
};
