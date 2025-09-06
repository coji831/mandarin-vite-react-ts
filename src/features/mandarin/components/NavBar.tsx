/**
 * NavBar component
 *
 * - Displays navigation buttons for switching between pages.
 * - Uses React Router's useNavigate for navigation.
 * - Pure presentational; does not manage persistence or parent state.
 * - Story 4-8: Updated for route-based navigation.
 */
import { useNavigate } from "react-router-dom";
import { useProgressContext } from "../context/ProgressContext";

export { NavBar };

function NavBar() {
  const navigate = useNavigate();
  const { selectedSectionId } = useProgressContext();

  return (
    <div className="flex flex-center gap-10 padding-10">
      {selectedSectionId ? (
        <button onClick={() => navigate(`/mandarin/flashcards/${selectedSectionId}`)}>
          Flashcards
        </button>
      ) : (
        <button onClick={() => navigate("/mandarin/section-select")}>Flashcards</button>
      )}
      <button onClick={() => navigate("/mandarin/basic")}>Basic</button>
    </div>
  );
}
