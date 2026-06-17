/**
 * @file apps/frontend/src/features/progress/types/index.ts
 * @description Progress types extracted from features/quiz (Story 17.2)
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

export type WordProgress = {
  wordId: string;
  learnedAt?: string | null;
  studyCount?: number;
  correctCount?: number;
  confidence?: number;
  nextReview?: string;
};

export type ProgressState = {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
};
