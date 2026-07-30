/**
 * @file hooks/useAutoSaveProgress.ts
 * @description Auto-save reading position with debounce, beforeunload, and unmount.
 * Story 21.7: Reading Progress
 *
 * Behavior:
 * 1. Watches currentSentence from readingStore
 * 2. Debounces 2s on sentence change — resets timer on each change
 * 3. Registers 'beforeunload' listener (calls saveProgress on tab close)
 * 4. On component unmount (useEffect cleanup), calls saveProgress synchronously
 * 5. Silent retry (1 attempt) on failure, then console.warn
 * 6. No-op when !isAuthenticated
 *
 * Never blocks reading — all errors are non-blocking.
 */
import { useEffect, useRef } from "react";
import { useReadingStore } from "../stores/readingStore";

const DEBOUNCE_MS = 2000;

export function useAutoSaveProgress() {
  const currentSentence = useReadingStore((s) => s.currentSentence);
  const isAuthenticated = useReadingStore((s) => s.isAuthenticated);
  const saveProgressRef = useRef(useReadingStore.getState().saveProgress);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<number>(currentSentence);

  // Keep ref in sync with store (ref avoids stale closures)
  useEffect(() => {
    saveProgressRef.current = useReadingStore.getState().saveProgress;
  }, []);

  // Debounced save on sentence change
  useEffect(() => {
    if (!isAuthenticated) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (lastSavedRef.current === useReadingStore.getState().currentSentence) return;
      lastSavedRef.current = useReadingStore.getState().currentSentence;
      await saveProgressRef.current();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentSentence, isAuthenticated]);

  // beforeunload — save on tab/window close
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      saveProgressRef.current();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthenticated]);

  // Unmount — save synchronously
  useEffect(() => {
    return () => {
      if (isAuthenticated) {
        saveProgressRef.current();
      }
    };
  }, [isAuthenticated]);
}
