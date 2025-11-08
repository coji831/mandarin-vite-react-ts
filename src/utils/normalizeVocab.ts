// Utility to normalize raw vocab and progress data to unified shape
import { WordBasic, WordProgress, WordList, ProgressList } from "../types/word";

import { VocabWord } from "./csvLoader";

export function normalizeVocab(raw: VocabWord[]): WordList {
  const itemsById: Record<string, WordBasic> = {};
  const itemIds: string[] = [];
  raw.forEach((row) => {
    if (!row.wordId) return;
    itemsById[row.wordId] = {
      wordId: row.wordId,
      chinese: row.Chinese ?? "",
      pinyin: row.Pinyin ?? "",
      english: row.English ?? "",
    };
    itemIds.push(row.wordId);
  });
  return { itemsById, itemIds };
}

export function normalizeProgress(raw: WordProgress[]): ProgressList {
  const progressByWordId: Record<string, WordProgress> = {};
  const wordIds: string[] = [];
  raw.forEach((row) => {
    if (!row.wordId) return;
    progressByWordId[row.wordId] = {
      wordId: row.wordId,
      correctCount: Number(row.correctCount ?? 0),
      incorrectCount: Number(row.incorrectCount ?? 0),
      lastReviewed: row.lastReviewed ?? null,
    };
    wordIds.push(row.wordId);
  });
  return { progressByWordId, wordIds };
}
