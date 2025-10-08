import React, { createContext, useContext, ReactNode } from "react";
import { useProgressContext } from "./ProgressContext";

// Placeholder for vocabulary data and logic
type VocabularyContextType = {
  selectVocabularyList: (listId: string, words: any[]) => void;
  selectedWords: any[];
};
const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

type VocabularyProviderProps = { children: ReactNode };
export function VocabularyProvider({ children }: VocabularyProviderProps) {
  // Provide selectVocabularyList and selectedWords from progress context
  // This assumes ProgressProvider is a parent of VocabularyProvider
  const { selectVocabularyList, selectedWords } = useProgressContext();
  const value: VocabularyContextType = {
    selectVocabularyList,
    selectedWords,
  };
  return <VocabularyContext.Provider value={value}>{children}</VocabularyContext.Provider>;
}

export function useVocabularyContext() {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error("useVocabularyContext must be used within a VocabularyProvider");
  return ctx;
}
