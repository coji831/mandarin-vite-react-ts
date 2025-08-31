export type Section = {
  sectionId: string;
  wordIds: string[];
  progress: Record<string | number, any>;
  history?: Record<string, string[]>;
};
export type UserProgress = {
  lists: Array<{
    listName: string;
    sections: Section[];
    dailyWordCount: number | null;
    completedSections: string[];
  }>;
};
