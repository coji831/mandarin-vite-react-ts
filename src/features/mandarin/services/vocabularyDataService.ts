// src/features/mandarin/services/vocabularyDataService.ts
// VocabularyDataService implementation with fallback and cache support (Epic 11, Story 11.2)

import { IVocabularyDataService, BaseService } from "./interfaces";
import { VocabularyList } from "../types/Vocabulary";
import { WordBasic, WordProgress } from "../types/word";
import { loadCsvVocab } from "../utils/csvLoader";

// Backend interface for DI/configurable backend swap
export interface IVocabularyBackend {
  fetchLists(): Promise<VocabularyList[]>;
  fetchWords(list: VocabularyList): Promise<WordBasic[]>;
}

// Default backend implementation using fetch and CSV loader
export class DefaultVocabularyBackend implements IVocabularyBackend {
  async fetchLists(): Promise<VocabularyList[]> {
    const res = await fetch("/data/vocabulary/vocabularyLists.json");
    if (!res.ok) throw new Error("Failed to fetch vocabulary lists");
    return res.json();
  }
  async fetchWords(list: VocabularyList): Promise<WordBasic[]> {
    const wordsRaw = await loadCsvVocab(`/data/vocabulary/${list.file}`);
    return wordsRaw.map((w) => ({
      wordId: w.wordId,
      chinese: w.Chinese,
      pinyin: w.Pinyin,
      english: w.English,
    }));
  }
}

export class VocabularyDataService
  extends BaseService<[string], VocabularyList>
  implements IVocabularyDataService
{
  private listsCache: VocabularyList[] | null = null;
  private wordsCache: Record<string, WordBasic[]> = {};
  private backend: IVocabularyBackend;

  /**
   * Fallback service must implement IVocabularyDataService and extend BaseService for type safety
   */
  declare fallbackService?: IVocabularyDataService & BaseService<[string], VocabularyList>;

  constructor(backend?: IVocabularyBackend) {
    super();
    this.backend = backend || new DefaultVocabularyBackend();
  }

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
      const data = await this.backend.fetchLists();
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
      const words = await this.backend.fetchWords(list);
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
