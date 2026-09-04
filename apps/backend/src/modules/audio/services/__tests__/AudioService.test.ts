/**
 * @file apps/backend/src/modules/audio/services/__tests__/AudioService.test.ts
 * @description Unit tests for the AudioService facade — ported from the
 * retired shared TTS capability tests into the modules/audio capability,
 * adapted to the unified exists-or-synthesize primitive (D4).
 *
 * Covers: input validation, two-tier cache (GCS exists → cached:true, else
 * synthesize → cached:false), soft Redis path-cache write on miss (incl.
 * best-effort failure), error taxonomy, and healthCheck delegation.
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

vi.mock("../paths.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../paths.js")>();
  return {
    ...actual,
    computeTTSHash: vi.fn((text: string, voice: string) => `hash-${text.length}-${voice.length}`),
  };
});

import { AudioService } from "../AudioService.js";

describe("AudioService", () => {
  let service: AudioService;
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
  const ttsOptions = { voice, languageCode: "cmn-CN", audioEncoding: "MP3" };

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
      getPublicUrl: vi.fn((_p: string) => barePublicUrl),
    };
    mockTtsClient = { synthesizeSpeech: vi.fn(), healthCheck: vi.fn() };
    service = new AudioService(mockCache, mockGcs, mockTtsClient);
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

  describe("TTS text guard (Phase 1 — pinyin must never reach TTS)", () => {
    it("rejects digit-suffixed pinyin text ('ba1') with a 400 validation error", async () => {
      await expect(service.getTtsUrl("ba1")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    });

    it("rejects tone-marked pinyin text ('bā') with a 400 validation error", async () => {
      await expect(service.getTtsUrl("bā")).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        statusCode: 400,
      });
    });

    it("allows Hanzi text ('八') to proceed", async () => {
      mockGcs.fileExists.mockResolvedValue(true);
      const result = await service.getTtsUrl("八");
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });

    it("allows multi-Hanzi text ('你好') to proceed", async () => {
      mockGcs.fileExists.mockResolvedValue(true);
      const result = await service.getTtsUrl("你好");
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });
  });

  describe("signed URL returns (browser playability)", () => {
    it("should return a SIGNED URL (with signature query params), never the bare public URL", async () => {
      mockGcs.fileExists.mockResolvedValue(true);

      const result = await service.getTtsUrl(text, voice);

      expect(mockGcs.fileExists).toHaveBeenCalledWith(cachePath);
      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      expect(result.audioUrl).toContain("X-Goog-Signature");
      expect(result.audioUrl).not.toBe(barePublicUrl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });

    it("should re-sign a fresh URL on a GCS hit without synthesizing or writing the cache", async () => {
      mockGcs.fileExists.mockResolvedValue(true);

      const result = await service.getTtsUrl(text, voice);

      expect(mockGcs.fileExists).toHaveBeenCalledWith(cachePath);
      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      expect(mockTtsClient.synthesizeSpeech).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
      expect(result).toEqual({ audioUrl: signedUrl, cached: true });
    });
  });

  describe("two-tier cache (exists ? cached : synthesize)", () => {
    it("should synthesize, upload, sign, and record the path in Redis on a full miss", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(Buffer.from("audio-bytes"));

      const result = await service.getTtsUrl(text, voice);

      expect(mockGcs.fileExists).toHaveBeenCalledWith(cachePath);
      expect(mockTtsClient.synthesizeSpeech).toHaveBeenCalledWith(text, ttsOptions);
      expect(mockGcs.uploadFile).toHaveBeenCalledWith(
        cachePath,
        Buffer.from("audio-bytes"),
        "audio/mpeg",
      );
      expect(mockGcs.getSignedUrl).toHaveBeenCalledWith(cachePath, 3600);
      expect(mockCache.set).toHaveBeenCalledWith(redisKey, cachePath, ttl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });

    it("should re-synthesize when the GCS file is missing (stale/cold path)", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const result = await service.getTtsUrl(text, voice);

      expect(mockTtsClient.synthesizeSpeech).toHaveBeenCalledWith(text, ttsOptions);
      expect(mockGcs.uploadFile).toHaveBeenCalledWith(
        cachePath,
        expect.any(Uint8Array),
        "audio/mpeg",
      );
      expect(mockCache.set).toHaveBeenCalledWith(redisKey, cachePath, ttl);
      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });

    it("should not fail the request when the Redis path-cache write is down (best-effort)", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockResolvedValue(new Uint8Array([9, 9]));
      mockCache.set.mockRejectedValue(new Error("redis unavailable"));

      const result = await service.getTtsUrl(text, voice);

      expect(result).toEqual({ audioUrl: signedUrl, cached: false });
    });
  });

  describe("error taxonomy", () => {
    it("should propagate a TTS_ERROR when synthesis fails", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTtsClient.synthesizeSpeech.mockRejectedValue(new Error("TTS API down"));

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
      });
    });

    it("should propagate a TTS_ERROR when signing the fresh URL fails", async () => {
      mockGcs.fileExists.mockResolvedValue(true);
      mockGcs.getSignedUrl.mockRejectedValue(new Error("signing failed"));

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
      });
    });

    it("should surface a clear auth error for invalid API keys (code 7)", async () => {
      mockGcs.fileExists.mockRejectedValue({ code: 7, details: "API key not valid" });

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
        message: expect.stringContaining("Authentication error"),
      });
    });

    it("should surface a clear billing error (code 3)", async () => {
      mockGcs.fileExists.mockRejectedValue({
        code: 3,
        details: "Billing account not enabled",
      });

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
        message: expect.stringContaining("Billing"),
      });
    });

    it("should surface a clear permission error (403)", async () => {
      mockGcs.fileExists.mockRejectedValue({ code: 403, details: "Forbidden" });

      await expect(service.getTtsUrl(text, voice)).rejects.toMatchObject({
        code: "TTS_ERROR",
        message: expect.stringContaining("permission denied"),
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

    it("probe gate — returns false without calling the TTS client when HEALTH_PROBE_EXTERNAL=false", async () => {
      const prev = process.env.HEALTH_PROBE_EXTERNAL;
      try {
        process.env.HEALTH_PROBE_EXTERNAL = "false";
        mockTtsClient.healthCheck.mockResolvedValue(true);
        await expect(service.healthCheck()).resolves.toBe(false);
        expect(mockTtsClient.healthCheck).not.toHaveBeenCalled();
      } finally {
        if (prev === undefined) {
          delete process.env.HEALTH_PROBE_EXTERNAL;
        } else {
          process.env.HEALTH_PROBE_EXTERNAL = prev;
        }
      }
    });
  });
});
