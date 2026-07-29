/**
 * @file modules/readers/services/__tests__/ReadersAudioService.test.ts
 * @description Unit tests for ReadersAudioService
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("../../../../shared/utils/hashUtils", () => ({
  computeHash: vi.fn((input: string) => {
    // Deterministic mock hash: length of input + "mockedhash"
    return `${input.length}mockedhash`;
  }),
}));

import { ReadersAudioService } from "../ReadersAudioService.js";
import type { PassageRecord } from "../../types/readers.js";

describe("ReadersAudioService", () => {
  let service: ReadersAudioService;
  let mockTtsService: any;
  let mockGcsClient: any;

  const makePassage = (sentences: Array<{ index: number; text: string }>): PassageRecord => ({
    id: "passage-1",
    hskLevel: 2,
    passageIndex: 0,
    title: "Test",
    content: { sentences },
    wordCount: sentences.length,
    knownWordRatio: 1.0,
    targetHskLevel: 2,
    generatedById: null,
    generatedAt: new Date(),
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockTtsService = { getTtsUrl: vi.fn() };
    mockGcsClient = {
      fileExists: vi.fn(),
      getPublicUrl: vi.fn((path: string) => `https://storage.example.com/${path}`),
    };

    service = new ReadersAudioService(mockTtsService as any, mockGcsClient as any);
  });

  describe("getPassageAudio", () => {
    it("should return empty audioUrls for empty sentences", async () => {
      const passage = makePassage([]);

      const result = await service.getPassageAudio(passage);

      expect(result).toEqual({ audioUrls: {} });
      expect(mockGcsClient.fileExists).not.toHaveBeenCalled();
      expect(mockTtsService.getTtsUrl).not.toHaveBeenCalled();
    });

    it("should return GCS URLs when all sentences found in GCS", async () => {
      const passage = makePassage([
        { index: 0, text: "你好。" },
        { index: 1, text: "世界。" },
      ]);

      mockGcsClient.fileExists.mockResolvedValue(true);

      const result = await service.getPassageAudio(passage);

      expect(result.audioUrls[0]).toEqual({
        url: "https://storage.example.com/tts/6mockedhash/0.mp3",
        source: "gcs",
      });
      expect(result.audioUrls[1]).toEqual({
        url: "https://storage.example.com/tts/6mockedhash/1.mp3",
        source: "gcs",
      });
      expect(mockTtsService.getTtsUrl).not.toHaveBeenCalled();
    });

    it("should call TtsService when GCS misses (full TTS path)", async () => {
      const passage = makePassage([{ index: 0, text: "你好。" }]);

      // GCS miss for sentence 0
      mockGcsClient.fileExists.mockResolvedValue(false);
      mockTtsService.getTtsUrl.mockResolvedValue({ audioUrl: "https://tts.example.com/audio.mp3" });

      const result = await service.getPassageAudio(passage);

      expect(mockGcsClient.fileExists).toHaveBeenCalledWith("tts/3mockedhash/0.mp3");
      expect(mockTtsService.getTtsUrl).toHaveBeenCalledWith("你好。");
      expect(result.audioUrls[0]).toEqual({
        url: "https://tts.example.com/audio.mp3",
        source: "ondemand",
      });
    });

    it("should handle mixed GCS hits and misses", async () => {
      const passage = makePassage([
        { index: 0, text: "你好。" },
        { index: 1, text: "世界。" },
      ]);

      // Sentence 0: GCS hit; Sentence 1: GCS miss → TTS
      mockGcsClient.fileExists
        .mockResolvedValueOnce(true) // sentence 0: GCS hit
        .mockResolvedValueOnce(false); // sentence 1: GCS miss

      mockTtsService.getTtsUrl.mockResolvedValue({
        audioUrl: "https://tts.example.com/shijie.mp3",
      });

      const result = await service.getPassageAudio(passage);

      expect(result.audioUrls[0]).toEqual({
        url: "https://storage.example.com/tts/6mockedhash/0.mp3",
        source: "gcs",
      });
      expect(result.audioUrls[1]).toEqual({
        url: "https://tts.example.com/shijie.mp3",
        source: "ondemand",
      });
    });

    it("should isolate per-sentence failures (one fails, others succeed)", async () => {
      const passage = makePassage([
        { index: 0, text: "你好。" },
        { index: 1, text: "世界。" },
        { index: 2, text: "测试。" },
      ]);

      // Sentence 0: GCS hit; Sentence 1: GCS miss → TTS success; Sentence 2: GCS miss → TTS fails
      mockGcsClient.fileExists
        .mockResolvedValueOnce(true) // sentence 0: hit
        .mockResolvedValueOnce(false) // sentence 1: miss
        .mockResolvedValueOnce(false); // sentence 2: miss

      mockTtsService.getTtsUrl
        .mockResolvedValueOnce({ audioUrl: "https://tts.example.com/shijie.mp3" }) // sentence 1 success
        .mockRejectedValueOnce(new Error("TTS quota exceeded")); // sentence 2 failure

      const result = await service.getPassageAudio(passage);

      expect(result.audioUrls[0]).toEqual({
        url: "https://storage.example.com/tts/9mockedhash/0.mp3",
        source: "gcs",
      });
      expect(result.audioUrls[1]).toEqual({
        url: "https://tts.example.com/shijie.mp3",
        source: "ondemand",
      });
      expect(result.audioUrls[2]).toEqual({
        url: "",
        source: "failed",
      });
    });
  });
});
