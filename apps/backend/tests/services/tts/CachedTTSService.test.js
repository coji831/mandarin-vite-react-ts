// apps/backend/tests/services/tts/CachedTTSService.test.js
// Unit tests for CachedTTSService

import { describe, test, expect, beforeEach } from "vitest";
import { CachedTTSService } from "../../../src/core/services/CachedTTSService.js";

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
  };
}

// Simple mock TTS service
function createMockTTS() {
  let callCount = 0;
  return {
    async synthesizeSpeech(text, options) {
      callCount++;
      return Buffer.from(`audio-${callCount}`);
    },
    getCallCount() {
      return callCount;
    },
  };
}

describe("CachedTTSService", () => {
  test("should generate consistent cache keys", () => {
    const mockCache = createMockCache();
    const mockTTS = createMockTTS();
    const service = new CachedTTSService(mockTTS, mockCache);

    const key1 = service.generateCacheKey("你好", "voice-a");
    const key2 = service.generateCacheKey("你好", "voice-a");
    const key3 = service.generateCacheKey("你好", "voice-b");

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).toMatch(/^tts:[a-f0-9]{64}$/);
  });

  test("cache miss should call TTS and store result", async () => {
    const mockCache = createMockCache();
    const mockTTS = createMockTTS();
    const service = new CachedTTSService(mockTTS, mockCache);

    const result = await service.synthesizeSpeech("你好", { voice: "test-voice" });

    expect(result).toBeInstanceOf(Buffer);
    expect(mockTTS.getCallCount()).toBe(1);
    expect(service.getMetrics().misses).toBe(1);
    expect(service.getMetrics().hits).toBe(0);
  });

  test("cache hit should skip TTS call", async () => {
    const mockCache = createMockCache();
    const mockTTS = createMockTTS();
    const service = new CachedTTSService(mockTTS, mockCache);

    // First call - cache miss
    await service.synthesizeSpeech("你好", { voice: "test-voice" });
    expect(mockTTS.getCallCount()).toBe(1);

    // Second call - cache hit
    const result = await service.synthesizeSpeech("你好", { voice: "test-voice" });
    expect(mockTTS.getCallCount()).toBe(1); // Should not increase
    expect(result).toBeInstanceOf(Buffer);
    expect(service.getMetrics().hits).toBe(1);
    expect(service.getMetrics().misses).toBe(1);
  });

  test("should track metrics correctly", async () => {
    const mockCache = createMockCache();
    const mockTTS = createMockTTS();
    const service = new CachedTTSService(mockTTS, mockCache);

    await service.synthesizeSpeech("text1"); // Miss
    await service.synthesizeSpeech("text1"); // Hit
    await service.synthesizeSpeech("text2"); // Miss
    await service.synthesizeSpeech("text1"); // Hit

    const metrics = service.getMetrics();
    expect(metrics.hits).toBe(2);
    expect(metrics.misses).toBe(2);
    expect(metrics.total).toBe(4);
    expect(metrics.hitRate).toBe("50.00");
  });

  test("should handle errors from TTS service", async () => {
    const mockCache = createMockCache();
    const mockTTS = {
      async synthesizeSpeech() {
        throw new Error("TTS API error");
      },
    };
    const service = new CachedTTSService(mockTTS, mockCache);

    await expect(service.synthesizeSpeech("text")).rejects.toThrow("TTS API error");
  });

  test("should delegate health check to TTS service", async () => {
    const mockCache = createMockCache();
    const mockTTS = {
      async synthesizeSpeech() {
        return Buffer.from("audio");
      },
      async healthCheck() {
        return true;
      },
    };
    const service = new CachedTTSService(mockTTS, mockCache);

    const result = await service.healthCheck();
    expect(result).toBe(true);
  });
});
