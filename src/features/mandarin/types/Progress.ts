import type { Word } from "./Vocabulary";

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
