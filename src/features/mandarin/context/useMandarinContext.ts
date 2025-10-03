import { useProgressContext } from "./ProgressContext";
import { useVocabularyContext } from "./VocabularyContext";

/**
 * Custom hook to consume both Mandarin progress and vocabulary context.
 */
export function useMandarinContext() {
  const progress = useProgressContext();
  const vocabulary = useVocabularyContext();
  return { ...progress, vocabulary };
}
