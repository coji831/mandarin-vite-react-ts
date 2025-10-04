import React, { createContext, useContext, ReactNode } from "react";

// Placeholder for vocabulary data and logic
type VocabularyContextType = Record<string, unknown>;
const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

type VocabularyProviderProps = { children: ReactNode };
export function VocabularyProvider({ children }: VocabularyProviderProps) {
  // TODO: implement vocabulary loading and state here
  const value: VocabularyContextType = {};
  return <VocabularyContext.Provider value={value}>{children}</VocabularyContext.Provider>;
}

export function useVocabularyContext() {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error("useVocabularyContext must be used within a VocabularyProvider");
  return ctx;
}
