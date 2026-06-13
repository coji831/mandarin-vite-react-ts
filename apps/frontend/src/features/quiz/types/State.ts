/**
 * Quiz state types
 *
 * Moved from features/mandarin/types/state.ts (Phase 2 restructure)
 * Contains UiState and UserState — ProgressState lives in Progress.ts
 */

import type { WordBasic } from "../../vocabulary/types/Word";

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
