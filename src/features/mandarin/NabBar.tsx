export { NavBar };

function NavBar({ setCurrentPage }: { setCurrentPage: any }) {
  return (
    <div
      style={{
        //background: "#fff",
        padding: "10px",
        borderBottom: "1px solid #ccc",
        marginBottom: "20px",
        textAlign: "center",
      }}
    >
      <button
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "6px 12px",
          border: "none",
          borderRadius: "4px",
          marginRight: "10px",
          cursor: "pointer",
        }}
        onClick={() => setCurrentPage("flashcards")}
      >
        Flashcards
      </button>
      <button
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "6px 12px",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => setCurrentPage("basic")}
      >
        Tones, Pronouns, Pinyin
      </button>
    </div>
  );
}
