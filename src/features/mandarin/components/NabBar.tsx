/**
 * NavBar component
 *
 * - Displays navigation buttons for switching between Flashcards and Basic pages.
 * - Receives setCurrentPage handler as prop.
 * - Pure presentational; does not manage persistence or parent state.
 */
export { NavBar };

function NavBar({ setCurrentPage }: Readonly<{ setCurrentPage: any }>) {
  return (
    <div className="flex flex-center gap-10 padding-10">
      <button onClick={() => setCurrentPage("flashcards")}>Flashcards</button>
      <button onClick={() => setCurrentPage("basic")}>Basic</button>
    </div>
  );
}
