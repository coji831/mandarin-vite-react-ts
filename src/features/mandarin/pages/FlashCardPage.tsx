/**
 * FlashCardPage route component
 *
 * Features:
 *   - Standalone page for flashcards, uses route param for listId
 *   - Loads vocabulary list metadata from /data/vocabulary/vocabularyLists.json
 *   - Loads vocabulary words from CSV, transforms to Word type via transformVocabWord
 *   - Uses ProgressContext for all state and navigation
 *   - Renders FlashCard component for the selected vocabulary list
 *   - Handles return to vocabulary list using React Router
 *   - All navigation is context- and router-based, no legacy state-driven navigation remains
 *   - Types and utilities imported from mandarin/types and mandarin/utils
 * Related: Story 7-6 Flashcard Page List-Based Navigation
 * Last updated: 2025-10-09
 */

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { loadCsvVocab } from "utils";
import { FlashCard } from "../components";
import { useProgressContext } from "../context";
import { VocabularyListMeta, Word } from "../types";
import { transformVocabWord } from "../utils";

export function FlashCardPage() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { selectedWords, loading, setSelectedList, setSelectedWords } = useProgressContext();

  // On mount: fetch vocabularyLists.json, find file for listId, load CSV, set selectedWords
  useEffect(() => {
    async function fetchAndLoadWords() {
      if (!listId) return;
      setSelectedList(listId);
      try {
        const res = await fetch("/data/vocabulary/vocabularyLists.json");
        if (!res.ok) throw new Error("Failed to fetch vocabulary lists");
        const lists = await res.json();

        const found = (lists as VocabularyListMeta[]).find((l) => l.id === listId);
        if (!found || !found.file) throw new Error("List not found or missing file");
        const words = await loadCsvVocab(`/data/vocabulary/${found.file}`);

        // Defensive: check if words is an array and has expected fields
        if (Array.isArray(words) && words.length > 0 && words[0].wordId) {
          // covert to Word type if needed (assuming loadCsvVocab returns VocabWord[])
          const wordList: Word[] = words.map(transformVocabWord);
          setSelectedWords(wordList);
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

  // Show loading state while fetching
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
      listId={listId || ""}
      onBackToList={() => navigate("/mandarin/vocabulary-list")}
    />
  );
}
