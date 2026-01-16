// apps/backend/tests/services/conversation/CachedConversationService.test.js
// Unit tests for CachedConversationService

import { CachedConversationService } from "../../../src/services/conversation/CachedConversationService.js";

// Simple mock cache service
function createMockCache() {
  const storage = new Map();
  return {
    async get(key) {
      return storage.get(key) || null;
    },
    async set(key, value, ttl) {
      storage.set(key, value);
    },
    async clear(pattern) {
      let count = 0;
      const prefix = pattern.replace("*", "");
      for (const key of storage.keys()) {
        if (key.startsWith(prefix)) {
          storage.delete(key);
          count++;
        }
      }
      return count;
    },
  };
}

// Simple mock conversation service
function createMockConversationService() {
  let callCount = 0;
  return {
    async generateConversationText(wordId, word, version) {
      callCount++;
      return {
        id: `${wordId}-${callCount}`,
        wordId,
        word,
        turns: [{ speaker: "A", chinese: word }],
      };
    },
    async generateTurnAudio(wordId, turnIndex, text, voice) {
      return { audioUrl: `audio-${wordId}-${turnIndex}.mp3` };
    },
    getCallCount() {
      return callCount;
    },
  };
}

describe("CachedConversationService", () => {
  test("should generate consistent cache keys", () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    const key1 = service.generateCacheKey("word-123");
    const key2 = service.generateCacheKey("word-123");
    const key3 = service.generateCacheKey("word-456");

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).toMatch(/^conv:word-123:[a-f0-9]{64}$/);
  });

  test("cache miss should call conversation service and store result", async () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    const result = await service.generateConversationText("word-123", "你好");

    expect(result.wordId).toBe("word-123");
    expect(mockConv.getCallCount()).toBe(1);
    expect(service.getMetrics().misses).toBe(1);
    expect(service.getMetrics().hits).toBe(0);
  });

  test("cache hit should skip conversation service call", async () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    // First call - cache miss
    await service.generateConversationText("word-123", "你好");
    expect(mockConv.getCallCount()).toBe(1);

    // Second call - cache hit
    const result = await service.generateConversationText("word-123", "你好");
    expect(mockConv.getCallCount()).toBe(1); // Should not increase
    expect(result.wordId).toBe("word-123");
    expect(service.getMetrics().hits).toBe(1);
    expect(service.getMetrics().misses).toBe(1);
  });

  test("should track metrics correctly", async () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    await service.generateConversationText("word-1", "word1"); // Miss
    await service.generateConversationText("word-1", "word1"); // Hit
    await service.generateConversationText("word-2", "word2"); // Miss
    await service.generateConversationText("word-1", "word1"); // Hit

    const metrics = service.getMetrics();
    expect(metrics.hits).toBe(2);
    expect(metrics.misses).toBe(2);
    expect(metrics.total).toBe(4);
    expect(metrics.hitRate).toBe("50.00");
  });

  test("should clear cache for specific wordId", async () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    // Generate conversations for multiple words
    await service.generateConversationText("word-123", "你好");
    await service.generateConversationText("word-456", "再见");

    const deletedCount = await service.clearCache("word-123");
    expect(deletedCount).toBe(1);

    // word-123 should be cleared (cache miss on next call)
    await service.generateConversationText("word-123", "你好");
    expect(service.getMetrics().misses).toBe(3); // 2 initial + 1 after clear

    // word-456 should still be cached (cache hit)
    await service.generateConversationText("word-456", "再见");
    expect(service.getMetrics().hits).toBe(1);
  });

  test("should delegate turn audio generation", async () => {
    const mockCache = createMockCache();
    const mockConv = createMockConversationService();
    const service = new CachedConversationService(mockConv, mockCache);

    const result = await service.generateTurnAudio("word-123", 0, "你好", "voice-a");

    expect(result.audioUrl).toBe("audio-word-123-0.mp3");
  });
});
