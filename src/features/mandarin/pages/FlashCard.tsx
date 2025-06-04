import { useState, useRef } from "react";
import { Sidebar } from "./Sidebar";

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
    <div id="flashcard" style={{ display: "flex", width: "100%" }}>
      {isSidePanelOpen && (
        <Sidebar
          cards={cards}
          setCurrentCardIndex={setCurrentCardIndex}
          currentCardIndex={currentCardIndex}
        />
      )}
      <div style={{ flex: 1, padding: "20px" }}>
        <div
          style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h1 style={{ fontSize: "24px", textAlign: "center" }}>
              Mandarin Flashcards
            </h1>
            <button
              style={{
                background: "#6c757d",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={toggleSidePanel}
            >
              {isSidePanelOpen ? "Hide Panel" : "Show Panel"}
            </button>
          </div>
          {showAddForm ? (
            <form onSubmit={handleAddSubmit} style={{ textAlign: "left" }}>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Character:
                  <input
                    type="text"
                    name="character"
                    value={newCard.character}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Pinyin:
                  <input
                    type="text"
                    name="pinyin"
                    value={newCard.pinyin}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Meaning:
                  <input
                    type="text"
                    name="meaning"
                    value={newCard.meaning}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Sentence:
                  <input
                    type="text"
                    name="sentence"
                    value={newCard.sentence}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Sentence Pinyin:
                  <input
                    type="text"
                    name="sentencePinyin"
                    value={newCard.sentencePinyin}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: "10px" }}>
                <label>
                  Sentence Meaning:
                  <input
                    type="text"
                    name="sentenceMeaning"
                    value={newCard.sentenceMeaning}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  type="submit"
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    background: "#6c757d",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                {currentCard.character}
              </div>
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
                onClick={() => playAudio(currentCard.character)}
              >
                Play Character
              </button>
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onClick={() => playAudio(currentCard.sentence)}
              >
                Play Sentence
              </button>
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    background: "#6c757d",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowMeaning(!showMeaning)}
                >
                  {showMeaning ? "Hide" : "Show"} Details
                </button>
                <button
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowAddForm(true)}
                >
                  Add Word
                </button>
                <button
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
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
              {showMeaning && (
                <div style={{ marginTop: "20px", textAlign: "left" }}>
                  <p>
                    <strong>Pinyin:</strong> {currentCard.pinyin}
                  </p>
                  <p>
                    <strong>Meaning:</strong> {currentCard.meaning}
                  </p>
                  <p>
                    <strong>Sentence:</strong> {currentCard.sentence}
                  </p>
                  <p>
                    <strong>Sentence Pinyin:</strong>{" "}
                    {currentCard.sentencePinyin}
                  </p>
                  <p>
                    <strong>Sentence Meaning:</strong>{" "}
                    {currentCard.sentenceMeaning}
                  </p>
                </div>
              )}
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={handlePrevious}
                >
                  Previous
                </button>
                <button
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={handleNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
