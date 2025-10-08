import { useState, Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { useUserIdentity } from "./useUserIdentity";
import { getUserProgress, saveUserProgress } from "../utils/ProgressStore";

export interface ProgressContextType {
  loadProgressForList: (listId: string, file: string) => Promise<void>;
  selectedList: string | null;
  setSelectedList: Dispatch<SetStateAction<string | null>>;
  selectedWords: any[];
  setSelectedWords: Dispatch<SetStateAction<any[]>>;
  masteredProgress: { [listId: string]: Set<string> };
  setMasteredProgress: Dispatch<SetStateAction<{ [listId: string]: Set<string> }>>;
  dailyWordCount: number | null;
  setDailyWordCount: Dispatch<SetStateAction<number | null>>;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  reviewIndex: number;
  setReviewIndex: Dispatch<SetStateAction<number>>;
  history: Record<string, string[]>;
  setHistory: Dispatch<SetStateAction<Record<string, string[]>>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  markWordLearned: (wordId: string) => void;
  saveCommitment: (count: number) => void;
  selectVocabularyList: (listId: string, words: any[]) => void;
  resetAndRedirectToVocabList: () => void;
}

export function useMandarinProgress(): ProgressContextType {
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
  const [selectedWords, setSelectedWords] = useState<any[]>([]);
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
          setSelectedWords(listEntry.words);
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
          sections: [],
          dailyWordCount: null,
          completedSections: [],
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
  const [dailyWordCount, setDailyWordCount] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [history, setHistory] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load progress and words for a specific list
  const loadProgressForList = async (listId: string, file: string) => {
    setLoading(true);
    try {
      let words: any[] = [];
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
      if (!listEntry || !listEntry.progress || typeof listEntry.progress !== "object") {
        setDailyWordCount(null);
      } else {
        setDailyWordCount(listEntry.dailyWordCount || null);
      }
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

  // Save daily commitment
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
      let userProgress = getUserProgress(userId);
      let listEntry = userProgress.lists.find((l: any) => l.id === selectedList);
      if (!listEntry) {
        listEntry = {
          id: selectedList,
          listName: selectedList,
          sections: [],
          dailyWordCount: null,
          completedSections: [],
          progress: {},
        };
        userProgress.lists.push(listEntry);
      }
      if (listEntry) {
        listEntry.dailyWordCount = count;
        saveUserProgress(userId, userProgress);
      }
      setDailyWordCount(count);
      setMasteredProgress((prev) => ({ ...prev, [selectedList!]: new Set() }));
      setHistory({});
      setReviewIndex(0);
      setError("");
    } catch (err) {
      setError("Failed to save commitment. Please try again.");
      resetAndRedirectToVocabList();
    }
    setLoading(false);
  };

  // Select vocabulary list
  const selectVocabularyList = (listId: string, words: any[]) => {
    setSelectedList(listId);
    // Do not set words here; handled on flashcard navigation
  };

  // Reset and redirect to vocab list page
  const resetAndRedirectToVocabList = () => {
    try {
      setSelectedList(null);
      setSelectedWords([]);
      setDailyWordCount(null);
      setInputValue("");
      setReviewIndex(0);
      setHistory({});
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
    loadProgressForList,
    selectedList,
    setSelectedList,
    selectedWords,
    setSelectedWords,
    masteredProgress,
    setMasteredProgress,
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
    markWordLearned,
    saveCommitment,
    selectVocabularyList,
    resetAndRedirectToVocabList,
  };
}
