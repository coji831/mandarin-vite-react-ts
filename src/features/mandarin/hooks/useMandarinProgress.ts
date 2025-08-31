/**
 * useMandarinProgress.ts
 *
 * Custom React hook and helpers for tracking Mandarin vocabulary learning progress.
 * - Centralizes progress state management for vocabulary lists, sections, and learned words.
 * - Provides localStorage helpers for persistent user progress.
 * - Exports hook and helpers for use in Mandarin feature components.
 */
import { useEffect, useState } from "react";
import { Section, UserProgress } from "../types";

/**
 * Loads user progress from localStorage.
 * Returns a UserProgress object, or an empty structure if not found or invalid.
 */
export function getUserProgress(): UserProgress {
  const raw = localStorage.getItem("user_progress");
  if (!raw) return { lists: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { lists: [] };
  }
}

/**
 * Saves user progress to localStorage.
 * @param progress - The UserProgress object to persist
 */
export function saveUserProgress(progress: UserProgress) {
  localStorage.setItem("user_progress", JSON.stringify(progress));
}

/**
 * Divides vocabulary words into sections for progress tracking.
 * @param words - Array of vocabulary word objects
 * @param perSection - Number of words per section
 * @returns Array of section objects
 */
function divideIntoSections(words: any[], perSection: number) {
  const sections = [];
  let sectionIdx = 1;
  for (let i = 0; i < words.length; i += perSection) {
    const chunk = words.slice(i, i + perSection);
    const sectionId = `section_${sectionIdx}`;
    sectionIdx++;
    const progress: Record<string, any> = {};
    chunk.forEach((w: any) => {
      progress[w.wordId] = {
        mastered: false,
        lastReviewed: null,
        reviewCount: 0,
        nextReview: null,
      };
    });
    sections.push({
      sectionId,
      wordIds: chunk.map((w: any) => String(w.wordId)),
      progress,
    });
  }
  return sections;
}

/**
 * Custom React hook for Mandarin vocabulary progress tracking.
 * - Manages state for selected list, sections, learned words, daily commitment, review, and history.
 * - Intended for use in Mandarin learning feature components.
 */
export function useMandarinProgress() {
  // Progress tracking state
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<any[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [learnedWordIds, setLearnedWordIds] = useState<string[]>([]);
  const [dailyWordCount, setDailyWordCount] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [sectionProgress, setSectionProgress] = useState<
    Record<string, number>
  >({});

  // Example progress tracking functions
  const markWordLearned = (wordId: string) => {
    // Implementation for marking a word as learned
    // ...
  };

  const saveCommitment = (count: number) => {
    if (!selectedList) return;
    const maxAllowed = Math.min(50, selectedWords.length || 50);
    if (!Number.isInteger(count) || count < 1 || count > maxAllowed) {
      setError(`Please enter a number between 1 and ${maxAllowed}`);
      return;
    }
    setLoading(true);
    try {
      const newSections = divideIntoSections(selectedWords, count);
      let userProgress = getUserProgress();
      let listEntry = userProgress.lists.find(
        (l: any) => l.listName === selectedList,
      );
      if (!listEntry) {
        listEntry = {
          listName: selectedList,
          sections: [],
          dailyWordCount: null,
          completedSections: [],
        };
        userProgress.lists.push(listEntry);
      }
      listEntry.sections = newSections;
      listEntry.dailyWordCount = count;
      saveUserProgress(userProgress);
      setDailyWordCount(count);
      setLearnedWordIds([]);
      setHistory({});
      setReviewIndex(0);
      setSections(newSections);
      setSectionProgress({});
      setError("");
    } catch (err) {
      setError("Failed to save commitment. Please try again.");
    }
    setLoading(false);
  };

  // Add selectVocabularyList function for VocabularyListSelector
  const selectVocabularyList = (listName: string, words: any[]) => {
    setSelectedList(listName);
    setSelectedWords(words);
    setSections([]);
    setSectionProgress({});
    setSelectedSectionId(null);
    // Optionally, set other state as needed
  };

  // ...add other progress-related functions as needed

  // Example effect for loading initial progress
  useEffect(() => {
    // Load progress from localStorage or API if needed
    // ...
  }, []);

  return {
    selectedList,
    setSelectedList,
    selectedWords,
    setSelectedWords,
    sections,
    setSections,
    learnedWordIds,
    setLearnedWordIds,
    dailyWordCount,
    setDailyWordCount,
    inputValue,
    setInputValue,
    reviewIndex,
    setReviewIndex,
    history,
    setHistory,
    error,
    setError,
    loading,
    setLoading,
    selectedSectionId,
    setSelectedSectionId,
    sectionProgress,
    setSectionProgress,
    markWordLearned,
    saveCommitment,
    selectVocabularyList,
    // ...return other state and functions as needed
  };
}
