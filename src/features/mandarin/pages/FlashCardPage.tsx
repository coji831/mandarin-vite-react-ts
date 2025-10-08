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

import { useParams, useNavigate, useLocation } from "react-router-dom";
// Type for vocabulary list object from vocabularyLists.json
type VocabularyListMeta = {
  id: string;
  name: string;
  description: string;
  file: string;
  wordCount: number;
  difficulty: string;
  tags: string[];
};
import { loadCsvVocab } from "../../../utils/csvLoader";
import { useProgressContext } from "../context/ProgressContext";
import { FlashCard } from "../components/FlashCard";
import { useEffect } from "react";

export function FlashCardPage() {
  // Story 7-6: Accept listId param and file from route
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const {
    selectedList,
    selectedWords,
    masteredProgress,
    markWordLearned,
    loading,
    setSelectedList,
    setSelectedWords,
  } = useProgressContext();

  // On mount: fetch vocabularyLists.json, find file for listId, load CSV, set selectedWords
  useEffect(() => {
    async function fetchAndLoadWords() {
      if (!listId) return;
      setSelectedList(listId);
      try {
        const res = await fetch("/data/vocabulary/vocabularyLists.json");
        if (!res.ok) throw new Error("Failed to fetch vocabulary lists");
        const lists = await res.json();
        console.log(lists);
        const found = (lists as VocabularyListMeta[]).find((l) => l.id === listId);
        if (!found || !found.file) throw new Error("List not found or missing file");
        const words = await loadCsvVocab(`/data/vocabulary/${found.file}`);
        console.log(words);
        // Defensive: check if words is an array and has expected fields
        if (Array.isArray(words) && words.length > 0 && words[0].wordId) {
          setSelectedWords(words);
        } else {
          console.error("Loaded words are empty or invalid:", words);
          setSelectedWords([]);
        }
      } catch (err) {
        console.error("Error loading vocabulary words:", err);
        setSelectedWords([]);
      }
    }
    fetchAndLoadWords();
  }, [listId, setSelectedList, setSelectedWords]);

  if (loading || !selectedWords) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Loading vocabulary list...</h2>
        <div className="spinner" style={{ margin: "24px auto" }} />
      </div>
    );
  }

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
      masteredWords={masteredProgress[listId || ""] || new Set()}
      markWordLearned={markWordLearned}
      onBackToSection={() => navigate("/mandarin/vocabulary-list")}
    />
  );
}
