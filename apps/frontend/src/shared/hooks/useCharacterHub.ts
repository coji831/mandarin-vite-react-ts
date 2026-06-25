/**
 * @file shared/hooks/useCharacterHub.ts
 * @description Thin hook for triggering Character Hub from any feature
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Cross-cutting: provides clean API to open/close the Hub overlay.
 * saveToReview lives in useReview hook (separate concern).
 */
import { useCallback } from "react";
import { useHubStore } from "../store/hubStore";

export function useCharacterHub() {
  const { isOpen, character, pinyin, open, close } = useHubStore();

  const openHub = useCallback(
    (char: string, pinyin?: string, position?: { x: number; y: number }) => {
      open(char, pinyin, position);
    },
    [open],
  );

  const closeHub = useCallback(() => {
    close();
  }, [close]);

  return { isOpen, character, pinyin, openHub, closeHub };
}
