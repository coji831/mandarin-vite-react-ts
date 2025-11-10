// __tests__/vocabularyDataService.test.ts
// Unit tests for VocabularyDataService (Epic 11, Story 11.2)

import { VocabularyDataService } from "../vocabularyDataService";
import { VocabularyList } from "../../types/Vocabulary";
import { WordBasic } from "../../types/word";

// Mock fetch and CSV loader
const mockLists: VocabularyList[] = [
  { id: "1", name: "Test List", description: "", file: "test.csv" },
];
const mockWords: WordBasic[] = [{ wordId: "1", chinese: "你", pinyin: "nǐ", english: "you" }];

global.fetch = jest.fn((url: string) => {
  if (url.includes("vocabularyLists.json")) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLists) });
  }
  return Promise.reject("Unknown URL");
}) as any;

jest.mock("../../utils/csvLoader", () => ({
  loadCsvVocab: jest.fn(() =>
    Promise.resolve([{ wordId: "1", Chinese: "你", Pinyin: "nǐ", English: "you" }])
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

  it("uses fallbackService for fetchAllLists on error", async () => {
    const fallback = new VocabularyDataService();
    fallback.fetchAllLists = jest.fn(() =>
      Promise.resolve([{ id: "2", name: "Fallback", description: "", file: "" }])
    );
    service.fallbackService = fallback;
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject("fail"));
    const lists = await service.fetchAllLists();
    expect(lists[0].id).toBe("2");
  });

  it("uses fallbackService for fetchWordsForList on error", async () => {
    const fallback = new VocabularyDataService();
    fallback.fetchWordsForList = jest.fn(() =>
      Promise.resolve([{ wordId: "2", chinese: "好", pinyin: "hǎo", english: "good" }])
    );
    service.fallbackService = fallback;
    service.fetchVocabularyList = jest.fn(() =>
      Promise.resolve({ id: "1", name: "", description: "", file: "test.csv" })
    );
    jest
      .requireMock("../../utils/csvLoader")
      .loadCsvVocab.mockImplementationOnce(() => Promise.reject("fail"));
    const words = await service.fetchWordsForList("1");
    expect(words[0].wordId).toBe("2");
  });
});
