// __tests__/interfaces.test.ts
// Tests for service interfaces and base class (Story 11.1)

import {
  BaseService,
  IVocabularyDataService,
  IAudioService,
  IConversationService,
} from "../interfaces";
import { VocabularyList } from "../../types/Vocabulary";
import { WordBasic, WordProgress } from "../../types/word";
import { Conversation, ConversationAudio } from "../../types/Conversation";

describe("Service Interfaces", () => {
  it("should allow implementation of IVocabularyDataService", () => {
    class TestVocabService implements IVocabularyDataService {
      fetchVocabularyList(listId: string): Promise<VocabularyList> {
        return Promise.resolve({ id: listId, name: "", description: "", file: "" });
      }
      fetchAllLists(): Promise<VocabularyList[]> {
        return Promise.resolve([]);
      }
      fetchWordsForList(listId: string): Promise<WordBasic[]> {
        return Promise.resolve([]);
      }
      fetchWordProgress(wordId: string): Promise<WordProgress> {
        return Promise.resolve({ wordId });
      }
    }
    const svc = new TestVocabService();
    expect(svc).toBeDefined();
  });

  it("should allow implementation of IAudioService", () => {
    class TestAudioService implements IAudioService {
      fetchAudioForConversation(): Promise<ConversationAudio> {
        return Promise.resolve({ conversationId: "", audioUrl: "", generatedAt: "" });
      }
      fetchAudioForWord(): Promise<ConversationAudio> {
        return Promise.resolve({ conversationId: "", audioUrl: "", generatedAt: "" });
      }
    }
    const svc = new TestAudioService();
    expect(svc).toBeDefined();
  });

  it("should allow implementation of IConversationService", () => {
    class TestConvService implements IConversationService {
      generateConversation(): Promise<Conversation> {
        return Promise.resolve({ id: "", wordId: "", word: "", turns: [], generatedAt: "" });
      }
    }
    const svc = new TestConvService();
    expect(svc).toBeDefined();
  });
});

describe("BaseService", () => {
  it("should support fallback logic", async () => {
    class PrimaryService extends BaseService<[string], string> {
      fetch(id: string): Promise<string> {
        return Promise.reject("fail");
      }
    }
    class FallbackService extends BaseService<[string], string> {
      fetch(id: string): Promise<string> {
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
