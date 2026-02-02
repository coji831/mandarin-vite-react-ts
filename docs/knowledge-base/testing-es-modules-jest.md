# ES Modules + Testing Patterns (Jest/Vitest)

**Category:** Testing  
**Last Updated:** February 2, 2026  
**Related:** Epic 13 (Backend), Epic 14 Story 14.1 (Frontend Vitest Migration)  

> **Note**: Both frontend and backend use **Vitest**. This guide covers Jest patterns from Epic 13 migration and current Vitest patterns.

## TL;DR Quick Reference

```bash
# Key Lessons from Epic 13 & 14 (Both use Vitest now)
✅ Use manual mocks (plain objects) instead of jest.fn() for ESM
✅ Vitest has better ESM support than Jest (both frontend & backend migrated)
✅ Use vi.fn() in Vitest (direct equivalent to jest.fn())
✅ Use ioredis-mock for Redis integration tests (no Docker)
✅ Explicit .js extensions required in Node ESM imports
❌ Avoid jest.spyOn() with ES modules - causes state pollution
```

---

## Overview

Testing ES modules with Jest requires workarounds due to incomplete ES module support. This guide covers common issues and solutions discovered during Story 13.5 (Redis Caching Layer).

---

## Problem: `jest.fn()` Not Defined in ES Modules

### Symptom

```bash
ReferenceError: jest is not defined

  9 | // Mock Prisma client
> 10 | jest.mock("../../src/models/index.js", () => ({
     | ^
  11 |   prisma: {
```

### Root Cause

Jest's global `jest` object is unavailable when using `NODE_OPTIONS=--experimental-vm-modules` for ES module support.

### Solution: Manual Mock Factories

**Instead of `jest.mock()` and `jest.fn()`:**

```typescript
// ❌ Don't do this in ES modules
jest.mock("../../src/services/ttsService.js");
const mockFn = jest.fn();
```

**Use manual factory functions:**

```typescript
// ✅ Do this instead
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

## Pattern: Spy-like Tracking

To verify function calls without `jest.fn()`:

```typescript
function createMockTtsServiceWithTracking() {
  const calls: Array<{ text: string; voice: string }> = [];

  return {
    synthesizeSpeech: async (text: string, voice: string) => {
      calls.push({ text, voice }); // Track calls
      return { audio: Buffer.from("mock") };
    },

    // Test helper: verify calls
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

**Problem**: Real Redis requires Docker (Testcontainers), which may not be available locally.

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

## Automated Edit Pitfall: replace_string_in_file

**Problem**: Using `replace_string_in_file` tool on test files can corrupt code (duplicate blocks, misaligned syntax).

**Solution**: When AI agent needs to update tests:

1. **Delete existing test file** (if corrupted)
2. **Create new test file** from scratch with `create_file`
3. Use simple, focused tests (5-6 tests per file max)

**Example** (Story 13.5 experience):

- Attempt 1: `replace_string_in_file` → duplicated test code, syntax errors
- Attempt 2: Delete + recreate → clean, working tests

---

## Jest Configuration for ES Modules

**Required `jest.config.js`:**

```javascript
export default {
  testEnvironment: "node",
  transform: {},
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // Strip .js extensions
  },
};
```

**Required `package.json` script:**

```json
{
  "scripts": {
    "test": "NODE_OPTIONS=--experimental-vm-modules jest"
  }
}
```

---

## Key Takeaways

1. **Manual mocks** are more reliable than `jest.mock()` in ES modules
2. **Factory functions** provide flexible, stateful mocks
3. **Closure-based tracking** replaces `jest.fn()` spy functionality
4. **ioredis-mock** eliminates Docker dependency for Redis tests
5. **Recreate test files** from scratch instead of automated edits when corrupted

---

**Related Guides:**

- [Testing Guide](../guides/testing-guide.md) — Project-specific test setup
- [Backend Architecture](./backend-architecture.md) — Testable service patterns
