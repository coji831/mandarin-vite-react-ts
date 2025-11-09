import { WordBasic } from "./word";

export type UserProgress = {
  lists: Array<UserProgressListEntry>;
};

export type UserProgressListEntry = {
  id: string;
  listName: string;
  progress?: Record<string, boolean>;
  words?: WordBasic[];
};
