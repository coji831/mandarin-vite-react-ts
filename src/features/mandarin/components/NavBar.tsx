/**
 * NavBar component
 *
 * - Displays navigation buttons for switching between pages.
 * - Uses React Router's useNavigate for navigation.
 * - Pure presentational; does not manage persistence or parent state.
 * - Story 4-8: Updated for route-based navigation.
 */
import { useNavigate } from "react-router-dom";
import { useProgressState } from "../hooks/useProgressState";

export { NavBar };

function NavBar() {
  const navigate = useNavigate();
  const selectedList = useProgressState((s: any) => s.selectedList ?? null);

  return (
    <div className="flex flex-center gap-10 padding-10">
      {selectedList ? (
        <button onClick={() => navigate(`/mandarin/flashcards/${selectedList}`)}>Flashcards</button>
      ) : (
        <button onClick={() => navigate("/mandarin")}>Flashcards</button>
      )}
      <button onClick={() => navigate("/mandarin/basic")}>Basic</button>
    </div>
  );
}
