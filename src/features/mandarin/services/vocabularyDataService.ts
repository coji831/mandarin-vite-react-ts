// src/features/mandarin/services/vocabularyDataService.ts
// VocabularyDataService implementation with fallback and cache support (Epic 11, Story 11.2)

import { IVocabularyDataService, BaseService } from "./interfaces";
import { VocabularyList } from "../types/Vocabulary";
import { WordBasic, WordProgress } from "../types/word";
import { loadCsvVocab, VocabWord } from "../utils/csvLoader";

const VOCAB_LISTS_URL = "/data/vocabulary/vocabularyLists.json";

export class VocabularyDataService
  extends BaseService<[string], VocabularyList>
  implements IVocabularyDataService
{
  private listsCache: VocabularyList[] | null = null;
  private wordsCache: Record<string, WordBasic[]> = {};

  /**
   * Fallback service must implement IVocabularyDataService and extend BaseService for type safety
   */
  declare fallbackService?: IVocabularyDataService & BaseService<[string], VocabularyList>;

  // Required by BaseService: fetch a single VocabularyList by id
  async fetch(listId: string): Promise<VocabularyList> {
    return this.fetchVocabularyList(listId);
  }

  async fetchVocabularyList(listId: string): Promise<VocabularyList> {
    const lists = await this.fetchAllLists();
    const found = lists.find((l) => l.id === listId);
    if (!found) throw new Error(`Vocabulary list not found: ${listId}`);
    return found;
  }

  async fetchAllLists(): Promise<VocabularyList[]> {
    if (this.listsCache) return this.listsCache;
    try {
      const res = await fetch(VOCAB_LISTS_URL);
      if (!res.ok) throw new Error("Failed to fetch vocabulary lists");
      const data = await res.json();
      this.listsCache = data;
      return data;
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetchAllLists();
      }
      throw err;
    }
  }

  async fetchWordsForList(listId: string): Promise<WordBasic[]> {
    if (this.wordsCache[listId]) return this.wordsCache[listId];
    const list = await this.fetchVocabularyList(listId);
    try {
      const wordsRaw = await loadCsvVocab(`/data/vocabulary/${list.file}`);
      // Map VocabWord to WordBasic
      const words: WordBasic[] = wordsRaw.map((w) => ({
        wordId: w.wordId,
        chinese: w.Chinese,
        pinyin: w.Pinyin,
        english: w.English,
      }));
      this.wordsCache[listId] = words;
      return words;
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetchWordsForList(listId);
      }
      throw err;
    }
  }

  async fetchWordProgress(wordId: string): Promise<WordProgress> {
    // Placeholder: implement actual progress fetch logic or fallback
    return { wordId };
  }
}
