// Unified and documented types for state slices (Epic 10-2)

/**
 * WordBasic: Canonical vocabulary word object
 * - wordId: unique string identifier
 * - chinese: Hanzi
 * - pinyin: Pinyin
 * - english: English meaning
 */
export type WordBasic = {
  wordId: string;
  chinese: string;
  pinyin: string;
  english: string;
};

/**
 * WordList: Normalized vocabulary list
 * - itemsById: map of wordId to WordBasic
 * - itemIds: ordered array of wordIds
 */
export type WordList = {
  itemsById: Record<string, WordBasic>;
  itemIds: string[];
};

/**
 * WordProgress: Per-word progress tracking
 * - wordId: string
 * - correctCount: number of correct answers
 * - incorrectCount: number of incorrect answers
 * - lastReviewed: ISO string or null
 */
export type WordProgress = {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: string | null;
};

/**
 * ProgressList: Normalized progress map
 * - progressByWordId: map of wordId to WordProgress
 * - wordIds: ordered array of wordIds
 */
export type ProgressList = {
  progressByWordId: Record<string, WordProgress>;
  wordIds: string[];
};

/**
 * UserState: User identity and preferences
 */
export type UserState = {
  userId?: string | null;
  preferences?: Record<string, unknown>;
};

/**
 * UiState: UI flags and compatibility fields
 */
export type UiState = {
  isLoading: boolean;
  lastUpdated?: string | null;
  selectedList?: string | null;
  selectedWords?: WordBasic[];
  masteredProgress?: Record<string, Set<string>>;
  error?: string;
};
