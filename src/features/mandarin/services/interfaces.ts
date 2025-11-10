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
 * Abstract base class for service implementations with fallback and backend swap support
 */

/**
 * Abstract base class for service implementations with fallback and backend swap support.
 *
 * To use, extend BaseService with concrete argument and return types for fetch.
 * Example:
 *   class MyService extends BaseService<MyArgs, MyResult> { ... }
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

/**
 * Example documentation for backend swap pattern:
 *
 * To swap backends, implement the relevant interface (e.g., IVocabularyDataService)
 * in a new class, and update the service provider in the app's dependency injection
 * or context layer. Use BaseService for shared fallback logic.
 */
