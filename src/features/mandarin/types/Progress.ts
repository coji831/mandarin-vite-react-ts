export type Section = {
  sectionId: string;
  wordIds: string[];
  progress: Record<string | number, any>;
  history?: Record<string, string[]>;
};
export type UserProgress = {
  lists: Array<{
    id: string;
    listName: string;
    sections: Section[];
    dailyWordCount: number | null;
    completedSections: string[];
    progress?: Record<string, boolean>;
    words?: any[];
  }>;
};
