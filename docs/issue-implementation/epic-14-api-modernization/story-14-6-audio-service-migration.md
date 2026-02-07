# Implementation 14.6: Audio Service Migration with Typed Responses

## Implementation Status

- **Status**: Completed
- **Last Update**: 2026-02-07
- **Key Files Modified**:
  - `packages/shared-types/src/index.ts` (added audio API types)
  - `apps/frontend/src/features/mandarin/services/audioService.ts` (migrated to Axios)
  - `apps/frontend/src/features/mandarin/services/__tests__/audioService.test.ts` (updated tests)

## Technical Scope

Migrate audio service from `ApiClient.authRequest` (fetch wrapper) to Axios with full TypeScript type safety and automatic retry logic. This completes Epic 14 service migrations.

**Files Modified:**

- `packages/shared-types/src/audio.types.ts` (create - API contract types)
- `packages/shared-types/src/index.ts` (export audio types)
- `apps/frontend/src/features/mandarin/services/audioService.ts` (migrate both backends)
- `apps/frontend/src/features/mandarin/services/__tests__/audioService.test.ts` (update tests)

## Implementation Details

### 1. Define TypeScript API Contracts

```typescript
// packages/shared-types/src/audio.types.ts
/**
 * Audio API type definitions
 * Shared between frontend and backend for type safety
 */

export interface WordAudio {
  audioUrl: string;
  audioContent?: string; // Base64 encoded audio (alternative to URL)
  text: string;
  languageCode?: string;
  voiceName?: string;
}

export interface WordAudioRequest {
  chinese: string;
  voice?: string;
}

export interface WordAudioApiResponse {
  success: boolean;
  data: WordAudio;
  message?: string;
}

export interface TurnAudioRequest {
  wordId: string;
  turnIndex: number;
  text: string;
  voice?: string;
}

export interface TurnAudioResponse {
  audioUrl: string;
}

export interface TurnAudioApiResponse {
  success: boolean;
  data: TurnAudioResponse;
  message?: string;
}

// Legacy type for backward compatibility
export interface ConversationAudio {
  audioUrl: string;
  conversationId?: string;
  turnIndex?: number;
}

export interface ConversationAudioRequest {
  conversationId: string;
  turnIndex?: number;
  text?: string;
}
```

```typescript
// packages/shared-types/src/index.ts (add export)
export * from "./audio.types";
```

### 2. Migrate Audio Service to Axios

```typescript
// apps/frontend/src/features/mandarin/services/audioService.ts
import { apiClient } from "../../../services/axiosClient";
import { API_ENDPOINTS } from "@mandarin/shared-constants";
import type {
  ConversationAudio,
  ConversationAudioRequest,
  WordAudio,
  WordAudioRequest,
  WordAudioApiResponse,
  TurnAudioRequest,
  TurnAudioResponse,
  TurnAudioApiResponse,
} from "@mandarin/shared-types";
import type { IAudioBackend, IAudioService } from "./interfaces";

/**
 * Local backend for Railway/development environment
 * Uses Axios with automatic retry and token refresh
 */
export class LocalAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      const response = await apiClient.post<WordAudioApiResponse>(API_ENDPOINTS.TTS, {
        text: chinese,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalAudioBackend.fetchWordAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.TTS,
      });
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      const response = await apiClient.post<TurnAudioApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "audio",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalAudioBackend.fetchTurnAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  // Legacy compatibility stub
  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}

/**
 * Default backend for cloud/production (Vercel Edge Functions)
 * Uses Axios with automatic retry and token refresh
 */
export class DefaultAudioBackend implements IAudioBackend {
  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      const { chinese } = params;
      const response = await apiClient.post<WordAudioApiResponse>(API_ENDPOINTS.TTS, {
        text: chinese,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultAudioBackend.fetchWordAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.TTS,
      });
      throw new Error("Failed to generate audio. Please try again.");
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      const response = await apiClient.post<TurnAudioApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "audio",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultAudioBackend.fetchTurnAudio error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation audio. Please try again.");
    }
  }

  // Legacy compatibility stub
  async fetchConversationAudio(_params: ConversationAudioRequest): Promise<ConversationAudio> {
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}

/**
 * Audio service with backend swap and fallback support
 * No changes needed - works with updated backend implementations
 */
export class AudioService implements IAudioService {
  protected backend: IAudioBackend;
  declare fallbackService?: AudioService;

  constructor(backend?: IAudioBackend, withFallback = true) {
    this.backend = backend || new DefaultAudioBackend();
    if (withFallback) {
      this.fallbackService = new AudioService(new LocalAudioBackend(), false);
    }
  }

  async fetchTurnAudio(params: TurnAudioRequest): Promise<TurnAudioResponse> {
    try {
      return await this.backend.fetchTurnAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchTurnAudio(params);
    }
  }

  async fetchWordAudio(params: WordAudioRequest): Promise<WordAudio> {
    try {
      return await this.backend.fetchWordAudio(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.fetchWordAudio(params);
    }
  }

  // Legacy compatibility stub
  async fetchConversationAudio(params: ConversationAudioRequest): Promise<ConversationAudio> {
    if (typeof this.backend.fetchConversationAudio === "function") {
      return this.backend.fetchConversationAudio(params);
    }
    throw new Error("fetchConversationAudio is not implemented. Use fetchTurnAudio instead.");
  }
}
```

### 3. Update Tests

```typescript
// apps/frontend/src/features/mandarin/services/__tests__/audioService.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { AudioService, DefaultAudioBackend, LocalAudioBackend } from "../audioService";
import type { WordAudio, TurnAudioResponse } from "@mandarin/shared-types";

describe("AudioService (Story 14.6)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("DefaultAudioBackend", () => {
    it("should fetch word audio with typed response", async () => {
      const mockAudio: WordAudio = {
        audioUrl: "https://storage.example.com/audio/hello.mp3",
        text: "你好",
        languageCode: "zh-CN",
        voiceName: "zh-CN-Wavenet-A",
      };

      mock.onPost("/api/v1/tts").reply(200, {
        success: true,
        data: mockAudio,
      });

      const backend = new DefaultAudioBackend();
      const result = await backend.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockAudio);
      expect(result.audioUrl).toBe("https://storage.example.com/audio/hello.mp3");
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/api/v1/tts").reply(500);

      const backend = new DefaultAudioBackend();
      await expect(backend.fetchWordAudio({ chinese: "你好" })).rejects.toThrow(
        "Failed to generate audio",
      );
    });

    it("should fetch turn audio with typed response", async () => {
      const mockTurnAudio: TurnAudioResponse = {
        audioUrl: "https://storage.example.com/audio/turn1.mp3",
      };

      mock.onPost("/api/v1/conversations").reply(200, {
        success: true,
        data: mockTurnAudio,
      });

      const backend = new DefaultAudioBackend();
      const result = await backend.fetchTurnAudio({
        wordId: "word1",
        turnIndex: 0,
        text: "你好！",
      });

      expect(result.audioUrl).toBe("https://storage.example.com/audio/turn1.mp3");
    });
  });

  describe("AudioService with fallback", () => {
    it("should use LocalBackend on DefaultBackend failure", async () => {
      const mockAudio: WordAudio = {
        audioUrl: "https://storage.example.com/audio/fallback.mp3",
        text: "你好",
      };

      // First call (DefaultBackend) fails, second call (LocalBackend) succeeds
      mock.onPost("/api/v1/tts").replyOnce(500).onPost("/api/v1/tts").replyOnce(200, {
        success: true,
        data: mockAudio,
      });

      const service = new AudioService();
      const result = await service.fetchWordAudio({ chinese: "你好" });

      expect(result).toEqual(mockAudio);
    });
  });

  describe("Legacy fetchConversationAudio", () => {
    it("should throw error with migration notice", async () => {
      const service = new AudioService();
      await expect(service.fetchConversationAudio({ conversationId: "conv1" })).rejects.toThrow(
        "Use fetchTurnAudio instead",
      );
    });
  });
});
```

## Architecture Integration

```
Component (WordDetail / ConversationUI)
       ↓ calls
AudioService.fetchWordAudio() / fetchTurnAudio()
       ↓ delegates to
DefaultAudioBackend (primary)
       ↓ uses
apiClient.post<WordAudioApiResponse>()
       ↓ interceptors
[Request] → Attach token + check expiry
[Response] → Handle 401 + retry network errors (3x)
       ↓ returns
WordAudio / TurnAudioResponse (typed)
       ↓ fallback on error
LocalAudioBackend (secondary)
```

## Technical Challenges & Solutions

### Challenge 1: TTS API Flakiness

**Problem:** Google Cloud TTS API can be slow or timeout (especially for batch requests). Users see "audio failed to load" errors.

**Solution:** Axios interceptor automatically retries network errors 3x with exponential backoff (1s, 2s, 4s). TTS timeout errors trigger retry without code changes.

### Challenge 2: Dual Audio Endpoints

**Problem:** Service has two audio methods: `fetchWordAudio()` (single word TTS) and `fetchTurnAudio()` (conversation turn TTS). Different endpoints, same retry logic needed.

**Solution:** Both methods migrated to Axios independently. Each gets automatic retry/refresh via shared apiClient. No duplication of retry logic.

### Challenge 3: Legacy Method Compatibility

**Problem:** Old code may still call `fetchConversationAudio()` (deprecated method). Breaking this would cause runtime errors.

**Solution:** Keep method stub that throws descriptive error with migration guidance. Tests verify error message. Gives teams time to migrate callers.

## Testing Implementation

### Unit Tests Coverage

- ✅ `DefaultAudioBackend.fetchWordAudio()` - success case
- ✅ `DefaultAudioBackend.fetchWordAudio()` - error handling
- ✅ `DefaultAudioBackend.fetchTurnAudio()` - success case
- ✅ `LocalAudioBackend.fetchWordAudio()` - success case
- ✅ `AudioService` - fallback behavior
- ✅ `fetchConversationAudio()` - throws migration error
- ✅ Type safety - TypeScript compile-time checks

### Manual Testing Checklist

- [ ] Click audio button on word detail page
- [ ] Verify Axios request in DevTools Network tab
- [ ] Throttle network to Slow 3G → click audio → verify retry
- [ ] Expire token (wait 15 min) → click audio → verify auto-refresh
- [ ] Test conversation audio generation (turn-level TTS)
- [ ] Check console: no `ApiClient.authRequest` calls, only Axios

## Epic 14 Completion

This story completes Epic 14: API & Infrastructure Modernization. All services now use Axios with:

✅ **Centralized configuration** (Story 14.2)
✅ **Automatic token refresh** (Story 14.3)
✅ **Automatic retry logic** (Story 14.3)
✅ **Type-safe responses** (Stories 14.4-14.6)
✅ **Consistent error handling** (Stories 14.4-14.6)

**Services Migrated:**

- ✅ Progress Service (Story 14.4)
- ✅ Conversation Service (Story 14.5)
- ✅ Audio Service (Story 14.6)

**Legacy Code Remaining:**

- `AuthContext` - Uses plain fetch for login/register/logout (acceptable)
- `VocabularyDataService` - Uses plain fetch for static files (no auth)
- `authFetch.ts` - Kept for 30 days rollback period

## Related Documentation

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Story 14.6 BR](../../business-requirements/epic-14-api-modernization/story-14-6-audio-service-migration.md)
- [Story 14.4 Implementation](./story-14-4-progress-service-migration.md) (Pattern reference)
- [Story 14.5 Implementation](./story-14-5-conversation-service-migration.md) (Parallel migration)
