import { useEffect, useState } from "react";
import vocabData from "../../data/mandarin.json"; // Assuming vocabData is in JSON format
import { NavBar } from "./NabBar";
import { Card, FlashCard } from "./pages";
import { Basic } from "./pages/Basic";
export { Mandarin };

function Mandarin() {
  const [currentPage, setCurrentPage] = useState("flashcards");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState(vocabData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("cards", JSON.stringify(cards));
    setIsLoading(false);
  }, [cards]);

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  const addCard = (newCard: Card | Card[]) => {
    if (Array.isArray(newCard)) {
      setCards((prev) => [...prev, ...newCard]);
    } else {
      setCards((prev) => [...prev, newCard]);
    }
  };

  if (isLoading) {
    return (
      <div style={{ fontSize: "20px", textAlign: "center" }}>Loading...</div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <NavBar setCurrentPage={setCurrentPage} />
      {currentPage === "flashcards" && (
        <FlashCard
          addCard={addCard}
          cards={cards}
          setCurrentCardIndex={setCurrentCardIndex}
          currentCardIndex={currentCardIndex}
          isSidePanelOpen={isSidePanelOpen}
          toggleSidePanel={toggleSidePanel}
        />
      )}
      {currentPage === "basic" && <Basic />}
    </div>
  );
}
