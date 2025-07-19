export { NavBar };

function NavBar({ setCurrentPage }: Readonly<{ setCurrentPage: any }>) {
  return (
    <div className="flex flex-center gap-10 padding-10">
      <button onClick={() => setCurrentPage("flashcards")}>Flashcards</button>
      <button onClick={() => setCurrentPage("basic")}>Basic</button>
    </div>
  );
}
