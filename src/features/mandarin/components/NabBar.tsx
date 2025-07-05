export { NavBar };

function NavBar({ setCurrentPage }: Readonly<{ setCurrentPage: any }>) {
  return (
    <div
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
