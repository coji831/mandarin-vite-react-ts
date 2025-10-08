/**
 * ProgressContext.tsx
 *
 * Provides React Context and Provider for Mandarin progress state and actions.
 * Wraps useMandarinProgress and exposes all state/actions to consumers.
 * The context includes vocabulary data loaded from CSV files via csvLoader.ts.
 */
import React, { createContext, useContext, useEffect } from "react";
import { useMandarinProgress, ProgressContextType } from "../hooks/useMandarinProgress";
import * as ProgressStore from "../utils/ProgressStore";

// Context exposes only masteredProgress for mastered word logic
import { Dispatch, SetStateAction } from "react";
export interface MasteredProgressContextType {
  masteredProgress: { [listId: string]: Set<string> };
  setMasteredProgress: Dispatch<SetStateAction<{ [listId: string]: Set<string> }>>;
  selectedList: string | null;
  setSelectedList: Dispatch<SetStateAction<string | null>>;
  markWordLearned: (wordId: string) => void;
  selectedWords: any[];
  setSelectedWords: Dispatch<SetStateAction<any[]>>;
  loading: boolean;
  loadProgressForList: (listId: string, file: string) => Promise<void>;
  selectVocabularyList: (listId: string, words: any[]) => void;
}

const ProgressContext = createContext<MasteredProgressContextType | undefined>(undefined);

type ProgressProviderProps = { children: React.ReactNode };
export function ProgressProvider({ children }: ProgressProviderProps) {
  useEffect(() => {
    ProgressStore.migrateOldProgressFormat();
  }, []);
  const {
    masteredProgress,
    setMasteredProgress,
    selectedList,
    setSelectedList,
    markWordLearned,
    selectedWords,
    setSelectedWords,
    loading,
    loadProgressForList,
    selectVocabularyList,
  } = useMandarinProgress();
  return (
    <ProgressContext.Provider
      value={{
        masteredProgress,
        setMasteredProgress,
        selectedList,
        setSelectedList,
        markWordLearned,
        selectedWords,
        setSelectedWords,
        loading,
        loadProgressForList,
        selectVocabularyList,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
// Optionally export ProgressStore utilities for advanced consumers (future use)
export { ProgressStore };
export function useProgressContext(): MasteredProgressContextType {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgressContext must be used within a ProgressProvider");
  return ctx;
}
