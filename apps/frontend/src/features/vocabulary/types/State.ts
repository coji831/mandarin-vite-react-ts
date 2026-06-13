import type { WordBasic } from "./Word";

/**
 * ListState: Normalized vocabulary state using WordBasic
 */
export type ListState = {
  itemsById: Record<string, WordBasic>;
  itemIds: string[];
};
