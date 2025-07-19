import { useState } from "react";

import { Basic, FlashCard, NavBar } from "../components";

export { Mandarin };

function Mandarin() {
  const [currentPage, setCurrentPage] = useState("flashcards");

  return (
    <div
      style={{
        width: "100%",
        height: "750px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavBar setCurrentPage={setCurrentPage} />

      {/* TODO: add new route */}
      {currentPage === "flashcards" && <FlashCard />}
      {currentPage === "basic" && <Basic />}
    </div>
  );
}
