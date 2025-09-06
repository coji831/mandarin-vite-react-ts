/**
 * FlashCardPage route component
 *
 * - Standalone page for flashcards, uses route param for sectionId.
 * - Uses ProgressContext for all state and navigation.
 * - Updates context selectedSectionId based on route parameter.
 * - Renders FlashCard component for the selected section.
 * - Handles return to section selection using React Router.
 * - Fully migrated for Story 4-8: all navigation is context- and router-based, no legacy state-driven navigation remains.
 * - Follows project conventions in docs/guides/conventions.md.
 */
import { useParams, useNavigate } from "react-router-dom";
import { useProgressContext } from "../context/ProgressContext";
import { FlashCard } from "../components/FlashCard";
import { useEffect } from "react";

export function FlashCardPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { sections, setSelectedSectionId } = useProgressContext();

  // Sync route parameter with context
  useEffect(() => {
    if (sectionId) {
      setSelectedSectionId(sectionId);
    }
  }, [sectionId, setSelectedSectionId]);

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

  return <FlashCard onBackToSection={() => navigate("/mandarin/section-select")} />;
}
