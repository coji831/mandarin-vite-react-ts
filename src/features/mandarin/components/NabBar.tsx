export { NavBar };

function NavBar({ setCurrentPage }: { setCurrentPage: any }) {
  return (
    <div
      className="container"
      style={{
        padding: "10px",
        textAlign: "center",
      }}
    >
      <button onClick={() => setCurrentPage("flashcards")}>Flashcards</button>
      <button onClick={() => setCurrentPage("basic")}>
        Tones, Pronouns, Pinyin
      </button>
    </div>
  );
}
