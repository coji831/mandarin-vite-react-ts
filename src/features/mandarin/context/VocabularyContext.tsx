import { createContext, ReactNode, useContext } from "react";

import { useProgressState } from "../hooks";
import { ExposedProgressState, Word } from "../types";

// Vocabulary context provides a small view over progress-selected words
type VocabularyContextType = {
  selectedWords: Word[];
};
const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

type VocabularyProviderProps = { children: ReactNode };
export function VocabularyProvider({ children }: VocabularyProviderProps) {
  // Provide selectedWords from the progress state via selector hook
  // This assumes ProgressProvider is a parent of VocabularyProvider
  const selectedWords = useProgressState((s: ExposedProgressState) => s.selectedWords ?? []);
  const value: VocabularyContextType = { selectedWords };
  return <VocabularyContext.Provider value={value}>{children}</VocabularyContext.Provider>;
}

export function useVocabularyContext() {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error("useVocabularyContext must be used within a VocabularyProvider");
  return ctx;
}
