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
  // Story 7-6: Accept listId param from route and load list
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const {
    selectedList,
    selectedWords,
    sections,
    markWordLearned,
    sectionProgress,
    loading,
    setSelectedList,
  } = useProgressContext();

  // If loading, show spinner
  if (loading || !selectedWords) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Loading vocabulary list...</h2>
        <div className="spinner" style={{ margin: "24px auto" }} />
      </div>
    );
  }

  // If listId is not selected, select it
  useEffect(() => {
    if (listId && selectedList !== listId) {
      setSelectedList(listId);
    }
  }, [listId, selectedList, setSelectedList]);

  // Validate selectedWords
  if (!selectedWords || selectedWords.length === 0) {
    return (
      <div>
        <h2>List Not Found or Empty</h2>
        <button onClick={() => navigate("/mandarin/vocabulary-list")}>
          Back to Vocabulary List
        </button>
      </div>
    );
  }

  // Render FlashCard deck in CSV order
  return (
    <FlashCard
      words={selectedWords}
      sectionProgress={sectionProgress[listId || ""] || 0}
      markWordLearned={markWordLearned}
      onBackToSection={() => navigate("/mandarin/vocabulary-list")}
    />
  );
}
