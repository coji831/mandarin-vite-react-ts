// __tests__/interfaces.test.ts
// Tests for service interfaces and base class (Story 11.1)

import { describe, it, expect } from "vitest";
import { VocabularyList, WordBasic } from "../../types";
import { WordProgress } from "@mandarin/shared-types";
import { BaseService, IAudioService, IVocabularyDataService } from "../interfaces";

describe("Service Interfaces", () => {
  it("should allow implementation of IVocabularyDataService", () => {
    class TestVocabService implements IVocabularyDataService {
      fetchVocabularyList(listId: string): Promise<VocabularyList> {
        return Promise.resolve({ id: listId, name: "", description: "", file: "" });
      }
      fetchAllLists(): Promise<VocabularyList[]> {
        return Promise.resolve([]);
      }
      fetchWordsForList(_listId: string): Promise<WordBasic[]> {
        return Promise.resolve([]);
      }
      fetchWordProgress(wordId: string): Promise<WordProgress> {
        return Promise.resolve({
          wordId,
          userId: "",
          studyCount: 0,
          correctCount: 0,
          confidence: 0,
          learnedAt: null,
          nextReviewDate: null,
          lastReviewedAt: null,
          lapseCount: 0,
          currentDelay: null,
          createdAt: "",
          updatedAt: "",
        });
      }
    }
    const svc = new TestVocabService();
    expect(svc).toBeDefined();
  });

  it("should allow implementation of IAudioService", () => {
    class TestAudioService implements IAudioService {
      fetchWordAudio(): Promise<{ audioUrl: string }> {
        return Promise.resolve({ audioUrl: "" });
      }
      fetchTurnAudio(): Promise<{ audioUrl: string }> {
        return Promise.resolve({ audioUrl: "" });
      }
    }
    const svc = new TestAudioService();
    expect(svc).toBeDefined();
  });
});

describe("BaseService", () => {
  it("should support fallback logic", async () => {
    class PrimaryService extends BaseService<[string], string> {
      fetch(_id: string): Promise<string> {
        return Promise.reject("fail");
      }
    }
    class FallbackService extends BaseService<[string], string> {
      fetch(_id: string): Promise<string> {
        return Promise.resolve("fallback");
      }
    }
    const primary = new PrimaryService();
    const fallback = new FallbackService();
    primary.fallbackService = fallback;
    const result = await primary.fetchWithFallback("test");
    expect(result).toBe("fallback");
  });
});
