# Implementation 14.5: Conversation Service Migration with Typed Responses

## Implementation Status

- **Status**: Planned
- **Last Update**: 2026-02-07
- **Key Files to Modify**:
  - `packages/shared-types/src/index.ts` (add conversation API types)
  - `apps/frontend/src/features/mandarin/services/conversationService.ts` (migrate to Axios)
  - `apps/frontend/src/features/mandarin/services/__tests__/conversationService.test.ts` (update mocks)

## Technical Scope

Migrate conversation service from `ApiClient.authRequest` (fetch wrapper) to Axios with full TypeScript type safety and automatic retry logic.

**Files Modified:**

- `packages/shared-types/src/conversation.types.ts` (create - API contract types)
- `packages/shared-types/src/index.ts` (export conversation types)
- `apps/frontend/src/features/mandarin/services/conversationService.ts` (migrate both backends)
- `apps/frontend/src/features/mandarin/services/__tests__/conversationService.test.ts` (update tests)

## Implementation Details

### 1. Define TypeScript API Contracts

```typescript
// packages/shared-types/src/conversation.types.ts
/**
 * Conversation API type definitions
 * Shared between frontend and backend for type safety
 */

export interface ConversationTurn {
  speaker: "user" | "system";
  text: string;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  wordId: string;
  turns: ConversationTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationGenerateRequest {
  wordId: string;
  hskLevel?: number;
  context?: string;
  type?: "text" | "audio";
}

export interface ConversationApiResponse {
  success: boolean;
  data: Conversation;
  message?: string;
}
```

```typescript
// packages/shared-types/src/index.ts (add export)
export * from "./conversation.types";
```

### 2. Migrate Conversation Service to Axios

```typescript
// apps/frontend/src/features/mandarin/services/conversationService.ts
import { apiClient } from "../../../services/axiosClient";
import { API_ENDPOINTS } from "@mandarin/shared-constants";
import type {
  Conversation,
  ConversationGenerateRequest,
  ConversationApiResponse,
} from "@mandarin/shared-types";
import type { IConversationBackend, IConversationService } from "./interfaces";

/**
 * Local backend for Railway/development environment
 * Uses Axios with automatic retry and token refresh
 */
export class LocalConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      const response = await apiClient.post<ConversationApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "text",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("LocalConversationBackend.generateConversation error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation. Please try again.");
    }
  }
}

/**
 * Default backend for cloud/production (Vercel Edge Functions)
 * Uses Axios with automatic retry and token refresh
 */
export class DefaultConversationBackend implements IConversationBackend {
  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      const response = await apiClient.post<ConversationApiResponse>(API_ENDPOINTS.CONVERSATION, {
        type: "text",
        ...params,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("DefaultConversationBackend.generateConversation error", {
        error: error.message,
        endpoint: API_ENDPOINTS.CONVERSATION,
      });
      throw new Error("Failed to generate conversation. Please try again.");
    }
  }
}

/**
 * Conversation service with backend swap and fallback support
 * No changes needed - works with updated backend implementations
 */
export class ConversationService implements IConversationService {
  private backend: IConversationBackend;
  declare fallbackService?: ConversationService;

  constructor(backend?: IConversationBackend, withFallback = true) {
    this.backend = backend || new DefaultConversationBackend();
    if (withFallback) {
      this.fallbackService = new ConversationService(new LocalConversationBackend(), false);
    }
  }

  async generateConversation(params: ConversationGenerateRequest): Promise<Conversation> {
    try {
      return await this.backend.generateConversation(params);
    } catch (err) {
      if (!this.fallbackService) throw err;
      return this.fallbackService.generateConversation(params);
    }
  }
}
```

### 3. Update Tests

```typescript
// apps/frontend/src/features/mandarin/services/__tests__/conversationService.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import {
  ConversationService,
  DefaultConversationBackend,
  LocalConversationBackend,
} from "../conversationService";
import type { Conversation } from "@mandarin/shared-types";

describe("ConversationService (Story 14.5)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("DefaultConversationBackend", () => {
    it("should generate conversation with typed response", async () => {
      const mockConversation: Conversation = {
        id: "conv1",
        wordId: "word1",
        turns: [
          { speaker: "system", text: "你好！" },
          { speaker: "user", text: "你好！你叫什么名字？" },
        ],
        createdAt: "2026-02-07T00:00:00Z",
        updatedAt: "2026-02-07T00:00:00Z",
      };

      mock.onPost("/api/v1/conversations").reply(200, {
        success: true,
        data: mockConversation,
      });

      const backend = new DefaultConversationBackend();
      const result = await backend.generateConversation({ wordId: "word1" });

      expect(result).toEqual(mockConversation);
      expect(result.turns[0].text).toBe("你好！");
    });

    it("should throw user-friendly error on failure", async () => {
      mock.onPost("/api/v1/conversations").reply(500);

      const backend = new DefaultConversationBackend();
      await expect(backend.generateConversation({ wordId: "word1" })).rejects.toThrow(
        "Failed to generate conversation",
      );
    });
  });

  describe("ConversationService with fallback", () => {
    it("should use LocalBackend on DefaultBackend failure", async () => {
      const mockConversation: Conversation = {
        id: "conv2",
        wordId: "word1",
        turns: [{ speaker: "system", text: "Hello!" }],
        createdAt: "2026-02-07T00:00:00Z",
        updatedAt: "2026-02-07T00:00:00Z",
      };

      // First call (DefaultBackend) fails, second call (LocalBackend) succeeds
      mock
        .onPost("/api/v1/conversations")
        .replyOnce(500)
        .onPost("/api/v1/conversations")
        .replyOnce(200, {
          success: true,
          data: mockConversation,
        });

      const service = new ConversationService();
      const result = await service.generateConversation({ wordId: "word1" });

      expect(result).toEqual(mockConversation);
    });
  });
});
```

## Architecture Integration

```
Component (ConversationUI)
       ↓ calls
ConversationService.generateConversation()
       ↓ delegates to
DefaultConversationBackend (primary)
       ↓ uses
apiClient.post<ConversationApiResponse>()
       ↓ interceptors
[Request] → Attach token + check expiry
[Response] → Handle 401 + retry network errors
       ↓ returns
Conversation (typed)
       ↓ fallback on error
LocalConversationBackend (secondary)
```

## Technical Challenges & Solutions

### Challenge 1: Preserving Fallback Pattern

**Problem:** Existing service has fallback from Default → Local backend. Axios migration must not break this pattern.

**Solution:** Keep service logic unchanged; only migrate backend implementations. Fallback chain works identically because both throw errors on failure, triggering service's try-catch logic.

### Challenge 2: Conversation Generation Timeouts

**Problem:** LLM API calls can be slow (5-15s). Network timeout errors should trigger retry, not immediate failure.

**Solution:** Axios interceptor already configured with 3x retry + exponential backoff for network errors (Story 14.3). No additional code needed; migration automatically gets retry behavior.

### Challenge 3: Error Message Consistency

**Problem:** Conversation errors should be user-friendly ("Failed to generate conversation") not technical ("Network Error").

**Solution:** Wrap all Axios calls in try-catch; catch block throws user-friendly messages. Log technical details for debugging but surface simple messages to UI.

## Testing Implementation

### Unit Tests Coverage

- ✅ `DefaultConversationBackend.generateConversation()` - success case
- ✅ `DefaultConversationBackend.generateConversation()` - error handling
- ✅ `LocalConversationBackend.generateConversation()` - success case
- ✅ `ConversationService` - fallback behavior
- ✅ Type safety - TypeScript compile-time checks

### Manual Testing Checklist

- [ ] Generate conversation on word detail page
- [ ] Verify Axios request in DevTools Network tab
- [ ] Throttle network to Slow 3G → verify retry behavior
- [ ] Expire token (wait 15 min) → generate conversation → verify auto-refresh
- [ ] Check console: no `ApiClient.authRequest` calls, only Axios

## Related Documentation

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Story 14.5 BR](../../business-requirements/epic-14-api-modernization/story-14-5-conversation-service-migration.md)
- [Story 14.4 Implementation](./story-14-4-progress-service-migration.md) (Pattern reference)
- [Story 14.3 Implementation](./story-14-3-axios-interceptors.md) (Interceptor details)
