/**
 * ProgressContext.tsx
 *
 * Provides React Context and Provider for Mandarin progress state and actions.
 * Wraps useMandarinProgress and exposes all state/actions to consumers.
 */
import React, { createContext, useContext } from "react";
import { useMandarinProgress } from "../hooks/useMandarinProgress";

const ProgressContext = createContext<
  ReturnType<typeof useMandarinProgress> | undefined
>(undefined);

type ProgressProviderProps = { children: React.ReactNode };
export function ProgressProvider({ children }: ProgressProviderProps) {
  const progress = useMandarinProgress();
  return (
    <ProgressContext.Provider value={progress}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx)
    throw new Error(
      "useProgressContext must be used within a ProgressProvider",
    );
  return ctx;
}
