import { vi, describe, it, expect, beforeEach } from "vitest";
// __tests__/vocabularyDataService.test.ts
// Unit tests for VocabularyDataService (Epic 11, Story 11.2)

import { VocabularyDataService } from "../vocabularyDataService";
import { VocabularyList } from "../../types/Vocabulary";
import { WordBasic } from "../../types/word";
import * as csvLoader from "../../utils/csvLoader";

// Mock fetch and CSV loader
const mockLists: VocabularyList[] = [
  { id: "1", name: "Test List", description: "", file: "test.csv" },
];
const mockWords: WordBasic[] = [{ wordId: "1", chinese: "你", pinyin: "nǐ", english: "you" }];

global.fetch = vi.fn((url: string) => {
  if (url.includes("vocabularyLists.json")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
  }
  return Promise.reject("Unknown URL");
}) as unknown as typeof fetch;

vi.mock("../../utils/csvLoader", () => ({
  loadCsvVocab: vi.fn(() =>
    Promise.resolve([{ wordId: "1", Chinese: "你", Pinyin: "nǐ", English: "you" }]),
  ),
}));

describe("VocabularyDataService", () => {
  let service: VocabularyDataService;

  beforeEach(() => {
    service = new VocabularyDataService();
  });

  it("fetchAllLists returns vocabulary lists", async () => {
    const lists = await service.fetchAllLists();
    expect(lists).toEqual(mockLists);
  });

  it("fetchVocabularyList returns a list by id", async () => {
    const list = await service.fetchVocabularyList("1");
    expect(list).toEqual(mockLists[0]);
  });

  it("fetchWordsForList returns mapped words", async () => {
    const words = await service.fetchWordsForList("1");
    expect(words).toEqual(mockWords);
  });

  it("fetchWordProgress returns word progress", async () => {
    const progress = await service.fetchWordProgress("1");
    expect(progress).toEqual({ wordId: "1" });
  });

  it("supports backend swap via DI", async () => {
    // Custom backend mock
    const customBackend = {
      fetchLists: vi.fn(() =>
        Promise.resolve([{ id: "99", name: "Custom", description: "", file: "custom.csv" }]),
      ),
      fetchWords: vi.fn(() =>
        Promise.resolve([
          { wordId: "99", chinese: "自定义", pinyin: "zì dìng yì", english: "custom" },
        ]),
      ),
    };
    const svc = new VocabularyDataService(customBackend);
    const lists = await svc.fetchAllLists();
    expect(lists[0].id).toBe("99");
    const words = await svc.fetchWordsForList("99");
    expect(words[0].wordId).toBe("99");
  });

  it("uses fallbackService for fetchAllLists on error", async () => {
    const fallback = new VocabularyDataService();
    fallback.fetchAllLists = vi.fn(() =>
      Promise.resolve([{ id: "2", name: "Fallback", description: "", file: "" }]),
    );
    service.fallbackService = fallback;
    (global.fetch as any).mockImplementationOnce(() => Promise.reject("fail"));
    const lists = await service.fetchAllLists();
    expect(lists[0].id).toBe("2");
  });

  it("uses fallbackService for fetchWordsForList on error", async () => {
    const fallback = new VocabularyDataService();
    fallback.fetchWordsForList = vi.fn(() =>
      Promise.resolve([{ wordId: "2", chinese: "好", pinyin: "hǎo", english: "good" }]),
    );
    service.fallbackService = fallback;
    service.fetchVocabularyList = vi.fn(() =>
      Promise.resolve({ id: "1", name: "", description: "", file: "test.csv" }),
    );
    vi.mocked(csvLoader.loadCsvVocab).mockImplementationOnce(() => Promise.reject("fail"));
    const words = await service.fetchWordsForList("1");
    expect(words[0].wordId).toBe("2");
  });
});
