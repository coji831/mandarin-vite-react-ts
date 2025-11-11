# Implementation 11.1: Design Unified Service Layer Interfaces

## Technical Scope

Define TypeScript interfaces and base classes for all data and audio (TTS) service operations, including fallback and backend swap support. All interfaces and base classes are located in `src/features/mandarin/services/`.

## Implementation Details

The following interfaces and base class were implemented:

```typescript
// src/features/mandarin/services/interfaces.ts
import { VocabularyList } from "../types/Vocabulary";
import { WordBasic, WordProgress } from "../types/word";
import { Conversation, ConversationAudio } from "../types/Conversation";

export interface IVocabularyDataService {
  fetchVocabularyList(listId: string): Promise<VocabularyList>;
  fetchAllLists(): Promise<VocabularyList[]>;
  fetchWordsForList(listId: string): Promise<WordBasic[]>;
  fetchWordProgress(wordId: string): Promise<WordProgress>;
}

export interface IAudioService {
  fetchAudioForConversation(
    conversationId: string,
    voice?: string,
    bitrate?: number
  ): Promise<ConversationAudio>;
  fetchAudioForWord(wordId: string, voice?: string, bitrate?: number): Promise<ConversationAudio>;
}

export interface IConversationService {
  generateConversation(params: {
    wordId: string;
    word: string;
    generatorVersion?: string;
  }): Promise<Conversation>;
}

/**
 * Abstract base class for service implementations with fallback and backend swap support.
 *
 * To use, extend BaseService with concrete argument and return types for fetch.
 * Example:
 *   class MyService extends BaseService<MyArgs, MyResult> { ... }
 */
export abstract class BaseService<Args extends unknown[] = [], Result = unknown> {
  abstract fetch(...args: Args): Promise<Result>;
  fallbackService?: BaseService<Args, Result>;
  async fetchWithFallback(...args: Args): Promise<Result> {
    try {
      return await this.fetch(...args);
    } catch (err) {
      if (this.fallbackService) {
        return this.fallbackService.fetch(...args);
      }
      throw err;
    }
  }
}
```

All interfaces are type-safe and extensible. Documentation for fallback and backend swap patterns is included in code comments and this doc.

## Architecture Integration

```
[Service Interfaces] → used by → [IVocabularyDataService, IAudioService, IConversationService]
                                 → used by → [All Mandarin feature components]
```

## Technical Challenges & Solutions

**Problem:** Ensuring extensibility for future backend swaps  
**Solution:** Used abstract base classes and clear interface contracts with generics for argument/result typing.

**Problem:** Documenting fallback logic patterns  
**Solution:** Provided code comments and usage examples in both code and docs.

## Testing Implementation

Unit tests were added in `src/features/mandarin/services/__tests__/interfaces.test.ts` to verify interface implementability and fallback logic in the base class.

## Cross-References

- [Business Requirements: Story 11.1](../../business-requirements/epic-11-service-layer-overhaul/story-11-1-design-service-interfaces.md)
- [Epic 11 README](../../business-requirements/epic-11-service-layer-overhaul/README.md)

---

_Status: Complete_

_Last updated: 2025-11-10_
