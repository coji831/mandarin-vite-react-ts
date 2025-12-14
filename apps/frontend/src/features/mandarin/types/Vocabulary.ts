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
