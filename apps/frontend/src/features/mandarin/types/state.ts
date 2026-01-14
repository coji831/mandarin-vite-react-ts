import type { WordBasic, WordProgress } from "./word";

// Unified and documented types for state slices (Epic 10-2)

/**
 * UserState: User identity and preferences
 */
export type UserState = {
  userId?: string | null;
  preferences?: Record<string, unknown>;
};

/**
 * UiState: UI flags only (Story 13.4: masteredProgress migrated to ProgressState)
 */
export type UiState = {
  isLoading: boolean;
  lastUpdated?: string | null;
  selectedList?: string | null;
  selectedWords?: WordBasic[];
  error?: string;
};

/**
 * ListState: Normalized vocabulary state using WordBasic
 */

export type ListState = {
  itemsById: Record<string, WordBasic>;
  itemIds: string[];
};

/**
 * ProgressState: Normalized progress state using WordProgress
 */
export type ProgressState = {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
};
