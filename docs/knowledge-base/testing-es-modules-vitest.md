# ES Modules + Vitest Testing Patterns

**Category:** Testing  
**Last Updated:** February 2, 2026  
**Related:** Epic 13 (Backend Migration), Epic 14 Story 14.1 (Frontend Migration)

> **Context**: Project migrated from Jest to Vitest (Epic 13-14). Both frontend and backend now use Vitest.

## TL;DR Quick Reference

```bash
# Key Lessons (Vitest + ES Modules)
✅ Use manual mocks (plain objects) for complex dependencies
✅ Use vi.fn() and vi.mock() for simple cases
✅ Use ioredis-mock for Redis integration tests (no Docker)
✅ Explicit .js extensions required in Node ESM imports
✅ Manual factory functions provide better isolation than auto-mocking
```

---

## Overview

Testing ES modules with Vitest requires understanding manual mock patterns for service-layer isolation. This guide covers patterns discovered during Epic 13 (backend migration) and Epic 14 (frontend migration).

---

## Pattern: Manual Mock Factories

For service-layer tests requiring dependency injection:

```typescript
// ✅ Manual factory pattern (preferred for services)
function createMockTtsService() {
  return {
    synthesizeSpeech: async (text: string) => ({
      audio: Buffer.from("mock-audio-data"),
      contentType: "audio/mpeg",
    }),
  };
}

function createMockCacheService() {
  let store = new Map<string, string>();

  return {
    get: async (key: string) => store.get(key) || null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  };
}

// Usage in tests
describe("CachedTTSService", () => {
  let mockTtsService;
  let mockCacheService;
  let cachedTtsService;

  beforeEach(() => {
    mockTtsService = createMockTtsService();
    mockCacheService = createMockCacheService();
    cachedTtsService = new CachedTTSService(mockTtsService, mockCacheService, 86400);
  });

  it("should use cache on second request", async () => {
    const params = { text: "hello", voice: "en-US" };

    // First call: cache miss
    await cachedTtsService.synthesizeSpeech(params);

    // Second call: cache hit
    const result = await cachedTtsService.synthesizeSpeech(params);
    expect(result.audio.toString()).toBe("mock-audio-data");
  });
});
```

**Why manual factories?**

- Explicit control over mock behavior
- No module resolution issues
- Clear test setup (easier to debug)
- Works consistently in ES modules

---

## Pattern: Stateful Mocks with Closure

For services that need internal state (cache stores, counters):

```typescript
function createMockCacheService() {
  let store = new Map<string, string>();
  let hits = 0;
  let misses = 0;

  return {
    get: async (key: string) => {
      const value = store.get(key) || null;
      if (value) hits++;
      else misses++;
      return value;
    },

    set: async (key: string, value: string, ttl?: number) => {
      store.set(key, value);
      // Optionally simulate TTL with setTimeout
    },

    getMetrics: () => ({ hits, misses }),

    // Test helper: reset state between tests
    __reset: () => {
      store.clear();
      hits = 0;
      misses = 0;
    },
  };
}
```

---

## Pattern: Async Mock Functions

For services with async methods:

```typescript
function createMockConversationService() {
  return {
    generateConversationText: async (wordId: string, settings: any) => {
      // Simulate async delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      return {
        conversationId: `conv-${wordId}`,
        turns: [
          { speaker: "A", text: "你好", pinyin: "nǐ hǎo" },
          { speaker: "B", text: "你好", pinyin: "nǐ hǎo" },
        ],
      };
    },
  };
}
```

---

## Pattern: Call Tracking (Alternative to vi.fn())

To verify function calls without vi.fn():

```typescript
function createMockTtsServiceWithTracking() {
  const calls: Array<{ text: string; voice: string }> = [];

  return {
    synthesizeSpeech: async (text: string, voice: string) => {
      calls.push({ text, voice }); // Track calls
      return { audio: Buffer.from("mock") };
    },

    // Test helpers
    getCalls: () => calls,
    getCallCount: () => calls.length,
    wasCalledWith: (text: string) => calls.some((c) => c.text === text),
  };
}

// Usage
it("should call TTS service once on cache miss", async () => {
  const mockTts = createMockTtsServiceWithTracking();
  const service = new CachedTTSService(mockTts, mockCache);

  await service.synthesizeSpeech("hello", "en-US");
  await service.synthesizeSpeech("hello", "en-US");

  expect(mockTts.getCallCount()).toBe(1); // Only called once (cache hit on 2nd)
  expect(mockTts.wasCalledWith("hello")).toBe(true);
});
```

---

## Integration Testing with ioredis-mock

**Problem**: Real Redis requires Docker, which may not be available locally.

**Solution**: Use `ioredis-mock` for in-memory Redis simulation:

```typescript
import RedisMock from "ioredis-mock";
import { RedisCacheService } from "../src/services/cache/RedisCacheService.js";

describe("Redis Integration Tests", () => {
  let mockRedis: RedisMock;
  let cacheService: RedisCacheService;

  beforeAll(async () => {
    mockRedis = new RedisMock();
    cacheService = new RedisCacheService(mockRedis, { ttl: { tts: 86400 } });
  });

  afterAll(async () => {
    await mockRedis.quit();
  });

  it("should set and get values", async () => {
    await cacheService.set("test-key", "test-value", 60);
    const result = await cacheService.get("test-key");
    expect(result).toBe("test-value");
  });
});
```

**Benefits**:

- No Docker dependency
- Fast test execution (<100ms vs 5s+ with Testcontainers)
- Supports most Redis commands (GET, SET, MGET, SCAN, etc.)

---

## When to Use vi.fn() vs Manual Mocks

**Use `vi.fn()`**:

- Simple spy/stub for single functions
- Quick inline mocks
- Testing function call counts

**Use manual factories**:

- Service-layer unit tests
- Complex dependencies with multiple methods
- Stateful mocks (caches, counters)
- Better test isolation

**Example with `vi.fn()`**:

```typescript
import { vi } from "vitest";

it("calls callback on success", async () => {
  const callback = vi.fn();
  await service.process(callback);
  expect(callback).toHaveBeenCalledWith({ success: true });
});
```

---

## Vitest Configuration for ES Modules

**Required `vitest.config.js` (backend)**:

```javascript
export default {
  test: {
    globals: true,
    environment: "node",
  },
};
```

**Required `package.json` script**:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**ES Module imports** (Node.js requirement):

```typescript
// ✅ Explicit .js extensions required
import { service } from "./service.js";

// ❌ Will fail in Node ESM
import { service } from "./service";
```

---

## Key Takeaways

1. **Manual mocks** provide better isolation for service-layer tests
2. **Factory functions** create flexible, stateful mocks
3. **Closure-based tracking** replaces vi.fn() for call verification
4. **ioredis-mock** eliminates Docker dependency for Redis tests
5. **vi.fn()** still useful for simple cases (callbacks, inline stubs)

---

**Related Documentation:**

- [Testing Guide](../guides/testing-guide.md) — Project-specific Vitest setup
- [Vitest Monorepo Version Conflicts](./vitest-monorepo-version-conflicts.md) — Vite version troubleshooting
- [Backend Architecture](./backend-architecture.md) — Testable service patterns
