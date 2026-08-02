/**
 * @file src/shared/services/__tests__/TtsService.test.ts
 * @description Unit tests for TtsService — signed-URL return path + path-based caching.
 *
 * Story 21.5 fix: TTS audio URLs must be SHORT-LIVED SIGNED GCS URLs so a browser
 * <audio>/Audio() element (which cannot attach Authorization headers) can play
 * them without the bucket being publicly readable. Redis caches the FILE PATH,
 * not the signed URL (signed URLs expire and would be served stale).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    cacheHit: vi.fn(),
    cacheMiss: vi.fn(),
  })),
}));

vi.mock("../../utils/hashUtils", () => ({
  computeTTSHash: vi.fn((text: string, voice: string) => `hash-${text.length}-${voice.length}`),
}));

vi.mock("../../config/tts", () => ({
  TTS_STORAGE_PATH: "tts/{hash}.mp3",
  TTS_SIGNED_URL_TTL_SECONDS: 3600,
}));

vi.mock("../../config/index", () => ({
  config: {
    tts: {
      voiceDefault: "cmn-CN-Wavenet-B",
      languageCode: "cmn-CN",
      maxWords: 15,
      audioEncoding: "MP3",
    },
  },
}));

import { TtsService } from "../TtsService.js";

describe("TtsService", () => {
  let service: TtsService;
  let mockCache: any;
  let mockGcs: any;
  let mockTtsClient: any;

  const text = "你好。";
  const voice = "cmn-CN-Wavenet-B";
  // computeTTSHash mock → deterministic
  const hash = `hash-${text.length}-${voice.length}`;
  const cachePath = `tts/${hash}.mp3`;
  const redisKey = `tts:path:${hash}`;
  const ttl = 86400;
  const signedUrl = `https://storage.googleapis.com/bucket/${cachePath}?X-Goog-Signature=abc&X-Goog-Expires=3600`;
  const barePublicUrl = `https://storage.googleapis.com/bucket/${cachePath}`;

  beforeEach(() => {
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    mockGcs = {
      fileExists: vi.fn(),
      uploadFile: vi.fn(),
      getSignedUrl: vi.fn(async (_p: string, _expiry?: number) => signedUrl),
    };
    mockTtsClient = { synthesizeSpeech: vi.fn(), healthCheck: vi.fn() };
    service = new TtsService(mockCache, mockGcs, mockTtsClient);
  });

  describe("input validation", () => {
    it("should throw validationError for empty or whitespace-only text", async () => {
      await expect(service.getTtsUrl("")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
      await expect(service.getTtsUrl("   ")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("should throw validationError when text exceeds maxWords", async () => {
      const longText = Array.from({ length: 16 }, () => "word").join(" ");
      await expect(service.getTtsUrl(longText)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("signed URL returns (browser playability)", () => {
    it("should return a SIGNED URL (with signature query params), never the bare public URL", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(true);
      mockGcs.getSignedUrl.mockResolvedValue(signedUrl);

      const result = await service.getTtsUrl(text, voice);

      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      expect(result.audioUrl).toContain("X-Goog-Signature");
      expect(result.audioUrl).not.toBe(barePublicUrl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });

    it("should re-sign a fresh URL on Redis cache hit when the file exists", async () => {
      mockCache.get.mockResolvedValue(cachePath);
      mockGcs.fileExists.mockResolvedValue(true);

      const result = await service.getTtsUrl(text, voice);

      expect(mockCache.get).toHaveBeenCalledWith(redisKey);
      expect(mockGcs.fileExists).toHaveBeenCalledWith(cachePath);
      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      // Path already cached — do not re-write or synthesize
      expect(mockCache.set).not.toHaveBeenCalled();
      expect(mockTtsClient.synthesizeSpeech).not.toHaveBeenCalled();
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });

    it("should backfill the Redis path on a GCS-only hit (no Redis entry)", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(true);

      const result = await service.getTtsUrl(text, voice);

      expect(mockCache.set).toHaveBeenCalledWith(redisKey, cachePath, ttl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });
  });

  describe("cache staleness & regeneration", () => {
    it("should invalidate a stale Redis entry and regenerate when the GCS file is missing", async () => {
      mockCache.get.mockResolvedValue(cachePath); // cached path, but file gone
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const result = await service.getTtsUrl(text, voice);

      expect(mockCache.delete).toHaveBeenCalledWith(redisKey);
      expect(mockTtsClient.synthesizeSpeech).toHaveBeenCalledWith(text, { voice });
      expect(mockGcs.uploadFile).toHaveBeenCalledWith(
        cachePath,
        expect.any(Uint8Array),
        "audio/mpeg",
      );
      expect(mockCache.set).toHaveBeenCalledWith(redisKey, cachePath, ttl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });

    it("should synthesize, upload, and sign on a full cache miss", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(Buffer.from("audio-bytes"));

      const result = await service.getTtsUrl(text, voice);

      expect(mockTtsClient.synthesizeSpeech).toHaveBeenCalledWith(text, { voice });
      expect(mockGcs.uploadFile).toHaveBeenCalledWith(
        cachePath,
        Buffer.from("audio-bytes"),
        "audio/mpeg",
      );
      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      expect(mockCache.set).toHaveBeenCalledWith(redisKey, cachePath, ttl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });

    it("should not fail the request when the Redis cache write is down (best-effort)", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(new Uint8Array([9, 9]));
      mockCache.set.mockRejectedValue(new Error("redis unavailable"));

      const result = await service.getTtsUrl(text, voice);

      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });
  });

  describe("error propagation", () => {
    it("should propagate a TTS_ERROR when synthesis fails", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockRejectedValue(new Error("TTS API down"));

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
      });
    });

    it("should propagate a TTS_ERROR when signing the fresh URL fails", async () => {
      mockCache.get.mockResolvedValue(null);
      mockGcs.fileExists.mockResolvedValue(true);
      mockGcs.getSignedUrl.mockRejectedValue(new Error("signing failed"));

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
      });
    });
  });

  describe("healthCheck", () => {
    it("should delegate to the TTS client", async () => {
      mockTtsClient.healthCheck.mockResolvedValue(true);
      await expect(service.healthCheck()).resolves.toBe(true);

      mockTtsClient.healthCheck.mockResolvedValue(false);
      await expect(service.healthCheck()).resolves.toBe(false);
    });
  });
});
