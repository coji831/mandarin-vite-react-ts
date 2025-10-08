export type UserProgress = {
  lists: Array<{
    id: string;
    listName: string;
    progress?: Record<string, boolean>;
    words?: any[];
  }>;
};
