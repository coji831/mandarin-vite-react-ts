// useMandarinProgress.ts
// Custom React hook for tracking Mandarin vocabulary learning progress.
// Uses extracted helpers for state management, progress calculation, and data loading.
import { useEffect, useState } from "react";
import { Section } from "../types";
import {
  buildSectionProgress,
  buildSectionsFromWords,
  loadUserProgressAndVocabulary,
  markSectionCompleted,
  updateSectionHistory,
  updateWordProgressInSection,
} from "../utils/progressHelpers";
import { getUserProgress, saveUserProgress } from "../utils/ProgressStore";
import { useUserIdentity } from "./useUserIdentity";
// Re-export progress helpers for compatibility with legacy code and pages
export { getUserProgress, saveUserProgress };

// All progress calculation, section building, and data loading logic is now handled by helpers in progressHelpers.ts.
// This hook manages state and delegates logic to helpers for maintainability and clarity.

export function useMandarinProgress() {
  // User identity
  const [identity] = useUserIdentity();
  const userId = identity.userId;

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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});

  // Example progress tracking functions
  const markWordLearned = (wordId: string) => {
    if (!selectedList) {
      resetAndRedirectToVocabList();
      return;
    }
    setLoading(true);
    try {
      let userProgress = getUserProgress(userId);
      let listEntry = userProgress.lists.find((l: any) => l.listName === selectedList);
      if (!listEntry) {
        resetAndRedirectToVocabList();
        return;
      }
      // Find section containing wordId
      let section = listEntry.sections.find((s: any) => s.wordIds.includes(wordId));
      if (!section) {
        resetAndRedirectToVocabList();
        return;
      }
      updateWordProgressInSection(section, wordId);
      updateSectionHistory(section, wordId);
      markSectionCompleted(listEntry, section);
      saveUserProgress(userId, userProgress);
      // Update state
      const { learnedWordIds, history, sectionProgress } = buildSectionProgress(
        listEntry,
        selectedWords
      );
      setLearnedWordIds(learnedWordIds);
      setHistory(history);
      setSectionProgress(sectionProgress);
      setError("");
    } catch (err) {
      setError("Failed to update progress. Please try again.");
      resetAndRedirectToVocabList();
    }
    setLoading(false);
  };

  const saveCommitment = (count: number) => {
    if (!selectedList) {
      resetAndRedirectToVocabList();
      return;
    }
    const maxAllowed = Math.min(50, selectedWords.length || 50);
    if (!Number.isInteger(count) || count < 1 || count > maxAllowed) {
      setError(`Please enter a number between 1 and ${maxAllowed}`);
      return;
    }
    setLoading(true);
    try {
      const newSections = buildSectionsFromWords(selectedWords, count);
      let userProgress = getUserProgress(userId);
      let listEntry = userProgress.lists.find((l: any) => l.listName === selectedList);
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
      saveUserProgress(userId, userProgress);
      setDailyWordCount(count);
      setLearnedWordIds([]);
      setHistory({});
      setReviewIndex(0);
      setSections(newSections);
      setSectionProgress({});
      setError("");
    } catch (err) {
      setError("Failed to save commitment. Please try again.");
      resetAndRedirectToVocabList();
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

  // Add reset and redirect function for error handling
  const resetAndRedirectToVocabList = () => {
    try {
      // Clear all state
      setSelectedList(null);
      setSelectedWords([]);
      setSections([]);
      setLearnedWordIds([]);
      setDailyWordCount(null);
      setInputValue("");
      setReviewIndex(0);
      setHistory({});
      setError("");
      setLoading(false);
      setSelectedSectionId(null);
      setSectionProgress({});

      // Redirect to vocab list page
      if (typeof window !== "undefined" && window.location) {
        window.location.href = "/mandarin/vocab-list";
      }
    } catch (err) {
      console.error("Failed to reset state:", err);
      setError("System error. Please refresh the page.");
    }
  };

  // Initialize progress on mount - load user progress for current userId
  useEffect(() => {
    loadUserProgressAndVocabulary({
      userId,
      setSelectedList,
      setSections,
      setDailyWordCount,
      setSelectedWords,
      setLearnedWordIds,
      setHistory,
      setSectionProgress,
      setError,
    });
  }, [userId]);

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
    resetAndRedirectToVocabList,
    // ...return other state and functions as needed
  };
}
