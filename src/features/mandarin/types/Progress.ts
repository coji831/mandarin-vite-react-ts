export type UserProgress = {
  lists: Array<{
    listName: string;
    sections: any[];
    dailyWordCount: number | null;
    completedSections: string[];
  }>;
};
