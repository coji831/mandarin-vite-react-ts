// apps/backend/tests/integration/cache.test.js
// Integration tests for Redis caching layer
// Note: Uses ioredis-mock instead of Testcontainers for environments without Docker

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import RedisMock from "ioredis-mock";
import { RedisCacheService } from "../../src/infrastructure/cache/RedisCacheService.js";
import { CachedTTSService } from "../../src/core/services/CachedTTSService.js";
import { CachedConversationService } from "../../src/core/services/CachedConversationService.js";

describe("Redis Caching Integration", () => {
  let redisClient;
  let cacheService;

  beforeAll(async () => {
    // Create Redis mock client (in-memory)
    redisClient = new RedisMock();
    cacheService = new RedisCacheService(redisClient);
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });

  beforeEach(async () => {
    // Clear all keys before each test
    await redisClient.flushdb();
  });

  describe("Real Redis Connection Lifecycle", () => {
    test("should connect to Redis successfully", async () => {
      const pingResult = await redisClient.ping();
      expect(pingResult).toBe("PONG");
    });

    test("should store and retrieve values", async () => {
      await cacheService.set("test-key", "test-value", 60);
      const result = await cacheService.get("test-key");
      expect(result).toBe("test-value");
    });

    test("should expire keys after TTL", async () => {
      await cacheService.set("expire-key", "expire-value", 1); // 1 second TTL

      // Value should exist immediately
      let result = await cacheService.get("expire-key");
      expect(result).toBe("expire-value");

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Value should be gone
      result = await cacheService.get("expire-key");
      expect(result).toBeNull();
    }, 3000);
  });

  describe("TTS Request Caching", () => {
    test("should achieve >50% hit rate after 3 requests", async () => {
      // Mock TTS service
      let callCount = 0;
      const mockTtsService = {
        async synthesizeSpeech(text, options) {
          callCount++;
          return Buffer.from(`audio-${callCount}`);
        },
      };

      const cachedTts = new CachedTTSService(mockTtsService, cacheService);

      // First request - cache miss
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(1);

      // Second request - cache hit
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(1); // Should not increase

      // Third request - cache hit
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(1); // Should not increase

      const metrics = cachedTts.getMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);

      const hitRate = parseFloat(metrics.hitRate);
      expect(hitRate).toBeGreaterThan(50); // 66.67%
    });

    test("should cache different voices separately", async () => {
      let callCount = 0;
      const mockTtsService = {
        async synthesizeSpeech(text, options) {
          callCount++;
          return Buffer.from(`audio-${options.voice}-${callCount}`);
        },
      };

      const cachedTts = new CachedTTSService(mockTtsService, cacheService);

      await cachedTts.synthesizeSpeech("你好", { voice: "voice-a" });
      await cachedTts.synthesizeSpeech("你好", { voice: "voice-b" });

      // Different voices should result in different cache keys
      expect(callCount).toBe(2);

      // Same voice should hit cache
      await cachedTts.synthesizeSpeech("你好", { voice: "voice-a" });
      expect(callCount).toBe(2);
    });
  });

  describe("Conversation Request Caching", () => {
    test("should achieve >50% hit rate after 3 requests", async () => {
      let callCount = 0;
      const mockConvService = {
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
      };

      const cachedConv = new CachedConversationService(mockConvService, cacheService);

      // First request - cache miss
      await cachedConv.generateConversationText("word-123", "你好");
      expect(callCount).toBe(1);

      // Second request - cache hit
      await cachedConv.generateConversationText("word-123", "你好");
      expect(callCount).toBe(1);

      // Third request - cache hit
      await cachedConv.generateConversationText("word-123", "你好");
      expect(callCount).toBe(1);

      const metrics = cachedConv.getMetrics();
      expect(metrics.total).toBe(3);
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);

      const hitRate = parseFloat(metrics.hitRate);
      expect(hitRate).toBeGreaterThan(50); // 66.67%
    });

    test("should cache different words separately", async () => {
      let callCount = 0;
      const mockConvService = {
        async generateConversationText(wordId, word, version) {
          callCount++;
          return {
            id: `${wordId}-${callCount}`,
            wordId,
            word,
            turns: [],
          };
        },
        async generateTurnAudio() {
          return { audioUrl: "audio.mp3" };
        },
      };

      const cachedConv = new CachedConversationService(mockConvService, cacheService);

      await cachedConv.generateConversationText("word-1", "你好");
      await cachedConv.generateConversationText("word-2", "再见");

      // Different words should result in different cache keys
      expect(callCount).toBe(2);

      // Same word should hit cache
      await cachedConv.generateConversationText("word-1", "你好");
      expect(callCount).toBe(2);
    });
  });

  describe("Cache Invalidation", () => {
    test("should clear cache for specific wordId", async () => {
      const mockConvService = {
        async generateConversationText(wordId, word, version) {
          return { id: wordId, wordId, word, turns: [] };
        },
        async generateTurnAudio() {
          return { audioUrl: "audio.mp3" };
        },
      };

      const cachedConv = new CachedConversationService(mockConvService, cacheService);

      // Generate conversations for multiple words
      await cachedConv.generateConversationText("word-123", "你好");
      await cachedConv.generateConversationText("word-456", "再见");

      // Clear cache for word-123
      const deletedCount = await cachedConv.clearCache("word-123");
      expect(deletedCount).toBe(1);

      // Verify word-123 cache is cleared (should be miss on next call)
      const metrics1 = cachedConv.getMetrics();
      const initialMisses = metrics1.misses;

      await cachedConv.generateConversationText("word-123", "你好");

      const metrics2 = cachedConv.getMetrics();
      expect(metrics2.misses).toBe(initialMisses + 1);

      // word-456 should still be cached (hit)
      await cachedConv.generateConversationText("word-456", "再见");
      const metrics3 = cachedConv.getMetrics();
      expect(metrics3.hits).toBe(metrics2.hits + 1);
    });

    test("should handle clearing non-existent cache keys", async () => {
      const mockConvService = {
        async generateConversationText(wordId, word, version) {
          return { id: wordId, wordId, word, turns: [] };
        },
        async generateTurnAudio() {
          return { audioUrl: "audio.mp3" };
        },
      };

      const cachedConv = new CachedConversationService(mockConvService, cacheService);

      const deletedCount = await cachedConv.clearCache("non-existent-word");
      expect(deletedCount).toBe(0);
    });
  });

  describe("TTL Expiration", () => {
    test("should miss cache after TTL expiration", async () => {
      let callCount = 0;
      const mockTtsService = {
        async synthesizeSpeech(text, options) {
          callCount++;
          return Buffer.from(`audio-${callCount}`);
        },
      };

      // Use very short TTL for testing (1 second)
      const shortTtlCache = {
        async get(key) {
          return cacheService.get(key);
        },
        async set(key, value, ttl) {
          return cacheService.set(key, value, 1); // Force 1 second TTL
        },
      };

      const cachedTts = new CachedTTSService(mockTtsService, shortTtlCache);

      // First request - cache miss
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(1);

      // Immediate second request - cache hit
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(1);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Third request after expiration - cache miss
      await cachedTts.synthesizeSpeech("你好", { voice: "test-voice" });
      expect(callCount).toBe(2);
    }, 4000);
  });

  describe("Error Handling", () => {
    test("should handle Redis connection errors gracefully", async () => {
      // Create a mock that throws errors
      const faultyClient = new RedisMock();
      const originalGet = faultyClient.get.bind(faultyClient);
      faultyClient.get = async () => {
        throw new Error("Connection failed");
      };

      const faultyCache = new RedisCacheService(faultyClient);

      const mockTtsService = {
        async synthesizeSpeech(text, options) {
          return Buffer.from("audio-data");
        },
      };

      const cachedTts = new CachedTTSService(mockTtsService, faultyCache);

      // Should not throw error, should fall back to TTS service
      const result = await cachedTts.synthesizeSpeech("你好", { voice: "test" });
      expect(result).toBeInstanceOf(Buffer);

      await faultyClient.disconnect();
    });
  });
});
