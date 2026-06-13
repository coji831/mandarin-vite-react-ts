/**
 * Progress types for quiz feature
 *
 * Moved from features/mandarin/types/Progress.ts (Phase 2 restructure)
 * WordProgress consolidated here from features/mandarin/types/word.ts
 */

import type { WordBasic } from "../../vocabulary/types/Word";

export type UserProgress = {
  lists: Array<UserProgressListEntry>;
};

export type UserProgressListEntry = {
  id: string;
  listName: string;
  progress?: Record<string, boolean>;
  words?: WordBasic[];
};

/**
 * WordProgress: Tracks learning progress for a vocabulary word
 */
export type WordProgress = {
  wordId: string;
  learnedAt?: string | null;
  // Backend progress fields (Story 13.4)
  studyCount?: number;
  correctCount?: number;
  confidence?: number; // 0.0 - 1.0 scale
  nextReview?: string; // ISO 8601 date string
};

/**
 * ProgressState: Normalized progress state using WordProgress
 */
export type ProgressState = {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
};
