/**
 * useProgressData - React hook for managing Mandarin vocabulary progress state.
 *
 * Features:
 * - Tracks mastered words per vocabulary list for the current user
 * - Loads vocabulary words from CSV files
 * - Persists progress and selected words to localStorage
 * - Restores progress when user or selected list changes
 * - Exposes API: loadProgressForList, markWordLearned, selectVocabularyList, resetAndRedirectToVocabList, getListProgress
 * - No daily commitment/section logic
 * - All progress updates are centralized in this hook
 */

import { useEffect, useState } from "react";

import { ProgressContextType, Word } from "../types";
import { getUserProgress, saveUserProgress } from "../utils";
import { useUserIdentity } from "./useUserIdentity";

export function useProgressData(): ProgressContextType {
  const [identity] = useUserIdentity();
  const userId = identity.userId;

  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [masteredProgress, setMasteredProgress] = useState<{ [listId: string]: Set<string> }>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Effect 1: Restore all mastered progress for all lists when user changes.
  // This must run first to ensure global progress is loaded before any per-list logic.
  useEffect(() => {
    const allMastered = restoreProgress(userId);
    setMasteredProgress(allMastered);
  }, [userId]);

  // Effect 2: Restore mastered progress for the selected list.
  // Runs after Effect 1 (if selectedList is set), so per-list progress is restored after global state.
  useEffect(() => {
    if (!selectedList) return;
    const masteredSet = restoreProgressForList(userId, selectedList);
    setMasteredProgress((prev) => ({ ...prev, [selectedList]: masteredSet }));
  }, [selectedList, userId]);

  // Effect 3: Persist mastered progress and selected words for the selected list.
  // Runs after restoration effects, so only the latest state is saved to localStorage.
  useEffect(() => {
    if (!selectedList) return;
    syncProgressWithStorage(
      userId,
      selectedList,
      masteredProgress[selectedList] || new Set(),
      selectedWords
    );
  }, [selectedList, masteredProgress, selectedWords, userId]);

  // Mark a word as learned
  const markWordLearned = (wordId: string) => {
    if (!selectedList) {
      setError("No vocabulary list selected.");
      return;
    }
    setLoading(true);
    try {
      setMasteredProgress((prev) => {
        const prevSet = prev[selectedList!] || new Set();
        const newSet = new Set(prevSet);
        newSet.add(wordId);
        return { ...prev, [selectedList!]: newSet };
      });
      setError("");
    } catch (err) {
      setError("Failed to update progress. Please try again.");
      resetAndRedirectToVocabList();
    }
    setLoading(false);
  };

  // Get mastered count and percent for a list
  function calculateListProgress(
    listId: string,
    wordCount: number
  ): { mastered: number; percent: number } {
    let mastered = 0;
    if (masteredProgress && masteredProgress[listId]) {
      mastered = masteredProgress[listId].size;
    }
    const percent = wordCount ? Math.round((mastered / wordCount) * 100) : 0;
    return { mastered, percent };
  }

  // Helper: Reset and redirect to vocab list page
  const resetAndRedirectToVocabList = () => {
    try {
      setSelectedList(null);
      setSelectedWords([]);
      setError("");
      setLoading(false);
      setMasteredProgress({});
      if (typeof window !== "undefined" && window.location) {
        window.location.href = "/mandarin/vocab-list";
      }
    } catch (err) {
      console.error("Failed to reset state:", err);
      setError("System error. Please refresh the page.");
    }
  };

  return {
    selectedList,
    setSelectedList,
    selectedWords,
    setSelectedWords,
    masteredProgress,
    setMasteredProgress,
    error,
    setError,
    loading,
    setLoading,
    markWordLearned,
    calculateListProgress,
  };
}

// Utils
function extractMasteredSet(progressObj: Record<string, boolean>): Set<string> {
  return new Set(Object.keys(progressObj).filter((k) => progressObj[k]));
}

function getOrCreateListEntry(userProgress: any, listId: string) {
  let listEntry = userProgress.lists.find((l: any) => l.id === listId);
  if (!listEntry) {
    listEntry = {
      id: listId,
      listName: listId,
      progress: {},
      words: [],
    };
    userProgress.lists.push(listEntry);
  }
  return listEntry;
}

function restoreProgress(userId: string) {
  // Extract all mastered sets for all lists
  const userProgress = getUserProgress(userId);
  //convert to {listId: Set<string>}
  const allMasteredSet: { [listId: string]: Set<string> } = {};
  userProgress.lists.forEach((listEntry: any) => {
    allMasteredSet[listEntry.id] = extractMasteredSet(listEntry.progress || {});
  });
  return allMasteredSet;
}

function restoreProgressForList(userId: string, listId: string) {
  // Extract mastered set and words for a specific list
  const userProgress = getUserProgress(userId);
  const listEntry = userProgress.lists.find((l: any) => l.id === listId);
  let masteredSet = new Set<string>();

  if (listEntry) {
    masteredSet = extractMasteredSet(listEntry.progress || {});
  }
  return masteredSet;
}

function syncProgressWithStorage(
  userId: string,
  listId: string,
  masteredSet: Set<string>,
  words: Word[]
) {
  const userProgress = getUserProgress(userId);
  const listEntry = getOrCreateListEntry(userProgress, listId);
  // Save masteredProgress
  listEntry.progress = {};
  masteredSet.forEach((wordId) => {
    listEntry.progress[wordId] = true;
  });
  // Save selectedWords
  listEntry.words = words;
  saveUserProgress(userId, userProgress);
}
