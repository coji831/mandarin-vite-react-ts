import type { VocabularyList } from "../types";

export function getFilteredVocabularyLists(
  lists: VocabularyList[],
  search: string,
  selectedDifficulties: string[],
  selectedTags: string[]
): () => VocabularyList[] {
  return () => {
    let filtered = lists;
    // Search (case-insensitive, accent-insensitive, partial match)
    if (search.trim()) {
      const norm = (s: string) =>
        s
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase();
      const s = norm(search);
      filtered = filtered.filter(
        (l) => norm(l.name).includes(s) || norm(l.description || "").includes(s)
      );
    }
    // Difficulty filter (OR logic)
    if (selectedDifficulties.length > 0) {
      filtered = filtered.filter(
        (l) => l.difficulty && selectedDifficulties.includes(l.difficulty)
      );
    }
    // Tag filter (OR logic)
    if (selectedTags.length > 0) {
      filtered = filtered.filter((l) => l.tags?.some((t) => selectedTags.includes(t)));
    }
    return filtered;
  };
}

export function extractDistinctDifficulties(lists: VocabularyList[]): () => string[] {
  return () => {
    const diffSet = new Set<string>();
    lists.forEach((l) => l.difficulty && diffSet.add(l.difficulty));
    return Array.from(diffSet).sort();
  };
}

export function extractDistinctTags(lists: VocabularyList[]): () => string[] {
  return () => {
    const tagSet = new Set<string>();
    lists.forEach((l) => l.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  };
}
