/**
 * FlashCardPage route component
 * Story: 4-5 Convert Flashcard Page with Parameters
 * - Standalone page for flashcards, uses route param for sectionId
 * - Uses useMandarin (ProgressContext) for state
 * - Renders FlashCard component for the selected section
 */
import { useParams, useNavigate } from "react-router-dom";
import { useProgressContext } from "../context/ProgressContext";
import { FlashCard } from "../components/FlashCard";

export function FlashCardPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { sections } = useProgressContext();

  // Validate sectionId
  const validSection = sections.find((s) => s.sectionId === sectionId);
  if (!validSection) {
    return (
      <div>
        <h2>Section Not Found</h2>
        <button onClick={() => navigate("/mandarin/section-select")}>Back to Section Select</button>
      </div>
    );
  }

  // Set selectedSectionId in context if needed (optional, depends on context logic)
  // ...

  return <FlashCard onBackToSection={() => navigate("/mandarin/section-select")} />;
}
