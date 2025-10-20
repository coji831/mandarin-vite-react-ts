/**
 * useMandarinContext - Combines Mandarin progress and vocabulary context into a single hook.
 *
 * Returns:
 *   - All progress context values and actions
 *   - vocabulary: Vocabulary context object
 *
 * Usage:
 *   const { selectedList, markWordLearned, vocabulary } = useMandarinContext();
 */
import { useProgressState } from "./useProgressState";
import { useVocabularyContext } from "../context/VocabularyContext";

export function useMandarinContext() {
  // Compose a minimal object with progress-derived helpers and vocabulary.
  const selectedList = useProgressState((s: any) => s.selectedList ?? null);
  const selectedWords = useProgressState((s: any) => s.selectedWords ?? []);
  const calculateListProgress = useProgressState(
    (s: any) =>
      s.calculateListProgress ?? ((id: string, n: number) => ({ mastered: 0, percent: 0 }))
  );
  const vocabulary = useVocabularyContext();
  return { selectedList, selectedWords, calculateListProgress, vocabulary };
}
