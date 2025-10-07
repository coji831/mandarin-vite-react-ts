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
 * Story: 4-5 Convert Flashcard Page with Parameters
 * Story: 4-8 Update Flashcard Navigation with Parameters
 * - Standalone page for flashcards, uses route param for sectionId
 * - Uses useMandarin (ProgressContext) for state
 * - Updates context selectedSectionId based on route parameter
 * - Renders FlashCard component for the selected section
 */
import { useParams, useNavigate } from "react-router-dom";
import { useProgressContext } from "../context/ProgressContext";
import { FlashCard } from "../components/FlashCard";
import { useEffect } from "react";

export function FlashCardPage() {
  // Story 7-2: Accept listId param from route
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { sections, setSelectedSectionId } = useProgressContext(); // TODO: refactor to use lists if needed

  // Sync route parameter with context (Story 7-2: use listId)
  useEffect(() => {
    if (listId) {
      setSelectedSectionId(listId); // TODO: refactor context to use listId if needed
    }
  }, [listId, setSelectedSectionId]);

  // Validate listId (Story 7-2)
  const validList = sections.find((s) => s.sectionId === listId); // TODO: refactor to use lists if needed
  if (!validList) {
    return (
      <div>
        <h2>List Not Found</h2>
        <button onClick={() => navigate("/mandarin/vocabulary-list")}>
          Back to Vocabulary List
        </button>
      </div>
    );
  }

  return <FlashCard onBackToSection={() => navigate("/mandarin/vocabulary-list")} />;
}
