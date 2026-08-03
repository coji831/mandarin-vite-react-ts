/**
 * @file apps/backend/src/modules/audio/services/__tests__/AudioPathCache.test.ts
 * @description Unit tests for AudioPathCache — Redis path cache (key tts:path:{hash},
 * TTL 86400) + stampede single-flight dedupe.
 *
 * The stampede test pins the critical guarantee: N concurrent
 * `synthesizeToPath(sameText, samePath)` → exactly ONE upstream
 * `synthesizeSpeech`.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    cacheHit: vi.fn(),
    cacheMiss: vi.fn(),
  })),
}));

import { AudioPathCache } from "../AudioPathCache.js";
import { AudioSynthesizer } from "../AudioSynthesizer.js";

describe("AudioPathCache", () => {
  let cache: AudioPathCache;
  let mockCache: any;

  const hash = "abc123";
  const redisKey = `tts:path:${hash}`;
  const path = `tts/${hash}.mp3`;
  const ttl = 86400;

  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    cache = new AudioPathCache(mockCache);
  });

  it("should read from the Redis path key (null when empty)", async () => {
    await expect(cache.getPath(hash)).resolves.toBeNull();
    expect(mockCache.get).toHaveBeenCalledWith(redisKey);
  });

  it("should write the path with a 24h TTL under the Redis path key", async () => {
    await cache.setPath(hash, path);
    expect(mockCache.set).toHaveBeenCalledWith(redisKey, path, ttl);
  });

  it("should delete the Redis path key", async () => {
    await cache.deletePath(hash);
    expect(mockCache.delete).toHaveBeenCalledWith(redisKey);
  });

  it("should tolerate a failing Redis write (best-effort, never throws)", async () => {
    mockCache.set.mockRejectedValue(new Error("redis unavailable"));
    await expect(cache.setPath(hash, path)).resolves.toBeUndefined();
  });

  describe("single-flight dedupe", () => {
    it("should run the fn exactly once for N concurrent identical keys", async () => {
      const fn = vi.fn(async () => "value");

      const results = await Promise.all([
        cache.dedupe("k1", fn),
        cache.dedupe("k1", fn),
        cache.dedupe("k1", fn),
      ]);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(results).toEqual(["value", "value", "value"]);
    });

    it("should clear the in-flight entry after settle so a later call re-runs", async () => {
      const fn = vi.fn(async () => "value");

      await cache.dedupe("k1", fn);
      await cache.dedupe("k1", fn);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should clear the entry on rejection so a later call can retry", async () => {
      const failing = vi.fn(async () => {
        throw new Error("boom");
      });
      const succeeding = vi.fn(async () => "ok");

      await expect(cache.dedupe("k1", failing)).rejects.toThrow("boom");
      await expect(cache.dedupe("k1", succeeding)).resolves.toBe("ok");
      expect(succeeding).toHaveBeenCalledTimes(1);
    });
  });
});

describe("AudioSynthesizer stampede guard", () => {
  it("N concurrent synthesizeToPath(sameText, samePath) → exactly ONE upstream synthesizeSpeech", async () => {
    const mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const mockGcs = {
      fileExists: vi.fn().mockResolvedValue(false),
      uploadFile: vi.fn().mockResolvedValue(undefined),
      getSignedUrl: vi.fn(async () => "https://storage.example.com/tts/x.mp3?sig"),
    };
    const mockTts = {
      synthesizeSpeech: vi.fn().mockImplementation(async () => {
        // Small delay to widen the concurrency window before the first resolves.
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Uint8Array([1, 2, 3]);
      }),
      healthCheck: vi.fn(),
    };

    const synthesizer = new AudioSynthesizer(new AudioPathCache(mockCache), mockGcs, mockTts);
    const text = "你好。";
    const path = "tts/passagehash/0.mp3";

    const results = await Promise.all(
      Array.from({ length: 5 }, () => synthesizer.synthesizeToPath(text, path)),
    );

    expect(mockTts.synthesizeSpeech).toHaveBeenCalledTimes(1);
    expect(mockGcs.uploadFile).toHaveBeenCalledTimes(1);
    results.forEach((r) =>
      expect(r).toEqual({ audioUrl: "https://storage.example.com/tts/x.mp3?sig", cached: false }),
    );
  });
});
