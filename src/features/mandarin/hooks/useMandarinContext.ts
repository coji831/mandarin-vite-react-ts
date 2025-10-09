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
import { useProgressContext, useVocabularyContext } from "../context";

export function useMandarinContext() {
  const progress = useProgressContext();
  const vocabulary = useVocabularyContext();
  return { ...progress, vocabulary };
}
