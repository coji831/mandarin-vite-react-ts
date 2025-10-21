import type { Word } from "./Vocabulary";
import type { ProgressState as ListsProgressState } from "./ProgressNormalized";
import type { UserState as AppUserState } from "../reducers/userReducer";
import type { UiState as AppUiState } from "../reducers/uiReducer";

export interface ProgressContextType {
  masteredProgress: { [listId: string]: Set<string> };
  setMasteredProgress: React.Dispatch<React.SetStateAction<{ [listId: string]: Set<string> }>>;
  selectedList: string | null;
  setSelectedList: React.Dispatch<React.SetStateAction<string | null>>;

  markWordLearned: (wordId: string) => void;
  selectedWords: Word[];
  setSelectedWords: React.Dispatch<React.SetStateAction<Word[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  //selectVocabularyList: (listId: string, words: Word[]) => void;

  calculateListProgress: (
    listId: string,
    wordCount: number
  ) => { mastered: number; percent: number };
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

export type UserProgress = {
  lists: Array<{
    id: string;
    listName: string;
    progress?: Record<string, boolean>;
    words?: Word[];
  }>;
};

export type UserProgressListEntry = {
  id: string;
  listName: string;
  progress?: Record<string, boolean>;
  words?: Word[];
};

// Legacy compatibility types
export type MasteredProgressMap = { [listId: string]: Set<string> };

export interface LegacyProgressState {
  selectedList: string | null;
  selectedWords: Word[];
  masteredProgress: MasteredProgressMap;
  loading: boolean;
  error: string;
}

// Exposed state shape that the provider currently returns for backwards
// compatibility. This is the root state merged with `ui` aliases so
// legacy selectors (s => s.selectedWords) continue to work.
export interface ExposedProgressState {
  lists: ListsProgressState;
  user: AppUserState;
  ui: AppUiState;
  // Legacy aliases
  selectedList: string | null;
  selectedWords: Word[];
  masteredProgress: MasteredProgressMap;
  loading: boolean;
  error: string;
}
