/**
 * ProgressContext.tsx
 *
 * Provides React Context and Provider for Mandarin progress state and actions.
 * Wraps useMandarinProgress and exposes all state/actions to consumers.
 * The context includes vocabulary data loaded from CSV files via csvLoader.ts.
 */
import React, { createContext, useContext, useEffect } from "react";

import { useProgressData } from "../hooks/useProgressContext";
import { ProgressContextType } from "../types";
import { migrateOldProgressFormat } from "../utils/progressHelpers";

export const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

type ProgressProviderProps = { children: React.ReactNode };
export function ProgressProvider({ children }: ProgressProviderProps) {
  useEffect(() => {
    migrateOldProgressFormat();
  }, []);
  const progressDataContext = useProgressData();
  // Map selectedListId and setSelectedListId to selectedList and setSelectedList for compatibility

  return (
    <ProgressContext.Provider value={progressDataContext}>{children}</ProgressContext.Provider>
  );
}

// Optionally export ProgressStore utilities for advanced consumers (future use)
export function useProgressContext(): ProgressContextType {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgressContext must be used within a ProgressProvider");
  return ctx;
}
