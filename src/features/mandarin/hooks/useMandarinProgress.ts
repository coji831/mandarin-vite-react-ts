import { useEffect, useState } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { Word } from "../types/Vocabulary";
import { getUserProgress, saveUserProgress } from "../utils/progressHelpers";
import { useUserIdentity } from "./useUserIdentity";

export interface ProgressDataContext {
  loadProgressForList: (listId: string, file: string) => Promise<void>;
  selectedList: string | null;
  setSelectedList: Dispatch<SetStateAction<string | null>>;
  selectedWords: Word[];
  setSelectedWords: Dispatch<SetStateAction<Word[]>>;
  masteredProgress: { [key: string]: Set<string> };
  setMasteredProgress: Dispatch<SetStateAction<{ [key: string]: Set<string> }>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  markWordLearned: (wordId: string) => void;
  selectVocabularyList: (listId: string, words: Word[]) => void;
  resetAndRedirectToVocabList: () => void;
  getListProgress: (listId: string, wordCount: number) => { mastered: number; percent: number };
}

export function useProgressData(): ProgressDataContext {
  const [identity] = useUserIdentity();
  const userId = identity.userId;
  // On initial mount, restore masteredProgress for all lists from localStorage
  useEffect(() => {
    const userProgress = getUserProgress(userId);
    const allMastered: { [listId: string]: Set<string> } = {};
    userProgress.lists.forEach((listEntry: any) => {
      const progressObj = listEntry.progress || {};
      allMastered[listEntry.id] = new Set(Object.keys(progressObj).filter((k) => progressObj[k]));
    });
    setMasteredProgress(allMastered);
  }, [userId]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [masteredProgress, setMasteredProgress] = useState<{ [listId: string]: Set<string> }>({});

  // Restore masteredProgress and selectedWords from localStorage on mount
  useEffect(() => {
    if (selectedList) {
      const userProgress = getUserProgress(userId);
      const listEntry = userProgress.lists.find((l: any) => l.id === selectedList);
      if (listEntry) {
        // Restore masteredProgress
        const progressObj = listEntry.progress || {};
        setMasteredProgress((prev) => ({
          ...prev,
          [selectedList]: new Set(Object.keys(progressObj).filter((k) => progressObj[k])),
        }));
        // Restore selectedWords
        if (listEntry.words) {
          setSelectedWords(listEntry.words as Word[]);
        }
      }
    }
  }, [selectedList, userId]);

  // Persist masteredProgress and selectedWords to localStorage whenever they change
  useEffect(() => {
    if (selectedList) {
      const userProgress = getUserProgress(userId);
      let listEntry = userProgress.lists.find((l: any) => l.id === selectedList);
      if (!listEntry) {
        listEntry = {
          id: selectedList,
          listName: selectedList,
          progress: {},
          words: [],
        };
        userProgress.lists.push(listEntry);
      }
      // Save masteredProgress
      if (masteredProgress[selectedList]) {
        if (!listEntry.progress) listEntry.progress = {};
        masteredProgress[selectedList].forEach((wordId) => {
          listEntry.progress![wordId] = true;
        });
      }
      // Save selectedWords
      if (selectedWords && selectedWords.length > 0) {
        listEntry.words = selectedWords;
      }
      saveUserProgress(userId, userProgress);
    }
  }, [selectedList, masteredProgress, selectedWords, userId]);
  // ...existing code...
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load progress and words for a specific list
  const loadProgressForList = async (listId: string, file: string) => {
    setLoading(true);
    try {
      let words: Word[] = [];
      if (file) {
        const res = await fetch(`/data/vocabulary/${file}`);
        if (res.ok) {
          const csvWords = await res.json();
          words = csvWords.map((w: any) => ({
            wordId: w.wordId,
            character: w.Chinese,
            pinyin: w.Pinyin,
            meaning: w.English,
          }));
        }
      }
      setSelectedList(listId);
      setSelectedWords(words);
      const userProgress = getUserProgress(userId);
      const listEntry = userProgress.lists.find((l: any) => l.id === listId);
      // No dailyWordCount logic needed
    } catch (err) {
      setError("Failed to load progress for list.");
    }
    setLoading(false);
  };

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

  // Select vocabulary list
  const selectVocabularyList = (listId: string, words: Word[]) => {
    setSelectedList(listId);
    // Do not set words here; handled on flashcard navigation
  };

  // Reset and redirect to vocab list page
  const resetAndRedirectToVocabList = () => {
    try {
      setSelectedList(null);
      setSelectedWords([]);
      // ...existing code...
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

  // Helper: get mastered count and percent for a list
  function getListProgress(
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

  return {
    loadProgressForList,
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
    selectVocabularyList,
    resetAndRedirectToVocabList,
    getListProgress,
  };
}
