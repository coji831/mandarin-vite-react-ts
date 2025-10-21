import type { UserProgress, UserProgressListEntry, MasteredProgressMap } from "../types/Progress";

// Convert stored UserProgress -> { [listId]: Set<string> }
export function restoreMasteredProgress(userProgress: UserProgress): MasteredProgressMap {
  const out: MasteredProgressMap = {};
  if (!userProgress || !Array.isArray(userProgress.lists)) return out;
  userProgress.lists.forEach((list) => {
    const progress = list.progress || {};
    out[list.id] = new Set(Object.keys(progress).filter((k) => progress[k]));
  });
  return out;
}

// Convert Sets -> UserProgress. If storedTemplate is provided, preserve list.words arrays.
export function persistMasteredProgress(
  mastered: MasteredProgressMap,
  storedTemplate?: UserProgress
): UserProgress {
  const template: UserProgress = storedTemplate || { lists: [] };
  const map = template.lists.reduce<Record<string, UserProgressListEntry>>((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {} as Record<string, UserProgressListEntry>);

  // ensure all lists present
  Object.keys(mastered).forEach((listId) => {
    if (!map[listId]) {
      map[listId] = { id: listId, listName: listId, progress: {}, words: [] };
    }
    const set = mastered[listId] || new Set<string>();
    const progressObj: Record<string, boolean> = {};
    set.forEach((id) => (progressObj[id] = true));
    map[listId].progress = progressObj;
    // keep existing words if present
    map[listId].words = map[listId].words || [];
  });

  return { lists: Object.keys(map).map((k) => map[k]) } as UserProgress;
}
