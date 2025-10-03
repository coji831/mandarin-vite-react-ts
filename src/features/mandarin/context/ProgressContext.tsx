/**
 * ProgressContext.tsx
 *
 * Provides React Context and Provider for Mandarin progress state and actions.
 * Wraps useMandarinProgress and exposes all state/actions to consumers.
 * The context includes vocabulary data loaded from CSV files via csvLoader.ts.
 */
import React, { createContext, useContext, useEffect } from "react";
import { useMandarinProgress } from "../hooks/useMandarinProgress";
import * as ProgressStore from "../utils/ProgressStore";

const ProgressContext = createContext<ReturnType<typeof useMandarinProgress> | undefined>(
  undefined
);

type ProgressProviderProps = { children: React.ReactNode };
export function ProgressProvider({ children }: ProgressProviderProps) {
  // Run migration from old progress format on first mount
  useEffect(() => {
    ProgressStore.migrateOldProgressFormat();
  }, []);
  const progress = useMandarinProgress();
  return <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>;
}

// Optionally export ProgressStore utilities for advanced consumers (future use)
export { ProgressStore };
export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgressContext must be used within a ProgressProvider");
  return ctx;
}
