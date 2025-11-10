// src/features/mandarin/services/interfaces.ts
// Unified service interfaces and base classes for vocabulary and audio services
// Story 11.1 (Epic 11: Service Layer Overhaul)

import { VocabularyList } from "../types/Vocabulary";
import { WordBasic, WordProgress } from "../types/word";
import { Conversation, ConversationAudio } from "../types/Conversation";

/**
 * Interface for vocabulary data service operations
 */
export interface IVocabularyDataService {
  fetchVocabularyList(listId: string): Promise<VocabularyList>;
  fetchAllLists(): Promise<VocabularyList[]>;
  fetchWordsForList(listId: string): Promise<WordBasic[]>;
  fetchWordProgress(wordId: string): Promise<WordProgress>;
  // ...other methods as needed
}

/**
 * Interface for audio (TTS) service operations
 */
export interface IAudioService {
  fetchAudioForConversation(
    conversationId: string,
    voice?: string,
    bitrate?: number
  ): Promise<ConversationAudio>;
  fetchAudioForWord(wordId: string, voice?: string, bitrate?: number): Promise<ConversationAudio>;
  // ...other methods as needed
}

/**
 * Interface for conversation generation service operations
 */
export interface IConversationService {
  generateConversation(params: {
    wordId: string;
    word: string;
    generatorVersion?: string;
  }): Promise<Conversation>;
  // ...other methods as needed
}

/**
 * Abstract base class for service implementations with backend swap and fallback support.
 *
 * Backend Swap Pattern:
 * - Each service (e.g., VocabularyDataService, AudioService) accepts a backend implementation via constructor (DI/config).
 * - To swap backends, implement the relevant backend interface (e.g., IVocabularyBackend, IAudioBackend),
 *   and pass it to the service constructor.
 * - This enables runtime backend selection, testing, and future extensibility.
 *
 * Fallback Pattern:
 * - Each service supports a fallbackService property (of the same interface/type).
 * - If the primary backend fails, the service will attempt the fallbackService.
 * - This ensures robust error handling and reliability.
 *
 * Example usage:
 *   const svc = new VocabularyDataService(new CustomBackend());
 *   svc.fallbackService = new VocabularyDataService(new LocalCacheBackend());
 *
 * For business requirements and rationale, see:
 *   docs/business-requirements/epic-11-service-layer-overhaul/story-11-5-backend-swap-fallback.md
 */
export abstract class BaseService<Args extends unknown[] = [], Result = unknown> {
  /**
   * Attempt the primary operation, with optional fallback logic
   */
  abstract fetch(...args: Args): Promise<Result>;

  /**
   * Optional: Provide a fallback service to use if the primary fails
   */
  fallbackService?: BaseService<Args, Result>;

  /**
   * Example fallback pattern
   */
  async fetchWithFallback(...args: Args): Promise<Result> {
    try {
      return await this.fetch(...args);
    } catch (err) {
      if (this.fallbackService) {
        // Optionally log the error or notify
        return this.fallbackService.fetch(...args);
      }
      throw err;
    }
  }
}
