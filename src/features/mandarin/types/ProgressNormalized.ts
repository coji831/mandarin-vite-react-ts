export type WordId = string;

export interface WordEntity {
  id: WordId;
  word: string;
  learnedAt?: string | null;
}

export interface ProgressState {
  wordsById: Record<WordId, WordEntity>;
  wordIds: WordId[];
}

export const initialState: ProgressState = { wordsById: {}, wordIds: [] };
