export type VocabularyListMeta = {
  id: string;
  name: string;
  description: string;
  file: string;
  wordCount: number;
  difficulty: string;
  tags: string[];
};
export type Word = {
  wordId: string;
  character?: string;
  pinyin?: string;
  meaning?: string;
  sentence?: string;
  sentencePinyin?: string;
  sentenceMeaning?: string;
};

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type VocabularyList = {
  id: string;
  name: string;
  description: string;
  file: string;
  wordCount?: number;
  difficulty?: DifficultyLevel;
  tags?: string[];
};
