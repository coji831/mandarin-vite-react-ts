/**
 * @file modules/readers/services/__tests__/ReadersAudioService.test.ts
 * @description Unit tests for ReadersAudioService — unified passage namespace (D4).
 *
 * The service delegates EVERY sentence to `audioService.synthesizeToPath(text,
 * tts/{passageHash}/{i}.mp3)` and maps the result:
 *   cached:true  → source "gcs" (file already existed)
 *   cached:false → source "ondemand" (just synthesized)
 *   throw        → source "failed" (batch never fails)
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
  let mockAudioService: any;

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
    mockAudioService = {
      synthesizeToPath: vi.fn(),
      getSignedUrl: vi.fn(),
      getTtsUrl: vi.fn(),
      healthCheck: vi.fn(),
    };

    service = new ReadersAudioService(mockAudioService as any);
  });

  describe("getPassageAudio", () => {
    it("should return empty audioUrls for empty sentences", async () => {
      const passage = makePassage([]);

      const result = await service.getPassageAudio(passage);

      expect(result).toEqual({ audioUrls: {} });
      expect(mockAudioService.synthesizeToPath).not.toHaveBeenCalled();
    });

    it("should use the unified passage path and source 'gcs' when the file already exists (cached:true)", async () => {
      const passage = makePassage([
        { index: 0, text: "你好。" },
        { index: 1, text: "世界。" },
      ]);

      mockAudioService.synthesizeToPath.mockResolvedValue({
        audioUrl: "https://storage.example.com/tts/6mockedhash/0.mp3?X-Goog-Signature=test",
        cached: true,
      });

      const result = await service.getPassageAudio(passage);

      expect(mockAudioService.synthesizeToPath).toHaveBeenCalledWith(
        "你好。",
        "tts/6mockedhash/0.mp3",
      );
      expect(mockAudioService.synthesizeToPath).toHaveBeenCalledWith(
        "世界。",
        "tts/6mockedhash/1.mp3",
      );
      expect(result.audioUrls[0]).toEqual({
        url: "https://storage.example.com/tts/6mockedhash/0.mp3?X-Goog-Signature=test",
        source: "gcs",
      });
      expect(result.audioUrls[1]).toEqual({
        url: "https://storage.example.com/tts/6mockedhash/0.mp3?X-Goog-Signature=test",
        source: "gcs",
      });
    });

    it("should report source 'ondemand' when the file was just synthesized (cached:false)", async () => {
      const passage = makePassage([{ index: 0, text: "你好。" }]);

      mockAudioService.synthesizeToPath.mockResolvedValue({
        audioUrl: "https://tts.example.com/audio.mp3",
        cached: false,
      });

      const result = await service.getPassageAudio(passage);

      expect(mockAudioService.synthesizeToPath).toHaveBeenCalledWith(
        "你好。",
        "tts/3mockedhash/0.mp3",
      );
      expect(result.audioUrls[0]).toEqual({
        url: "https://tts.example.com/audio.mp3",
        source: "ondemand",
      });
    });

    it("should handle mixed cached/existing and just-synthesized sentences", async () => {
      const passage = makePassage([
        { index: 0, text: "你好。" },
        { index: 1, text: "世界。" },
      ]);

      // Sentence 0: file already existed; Sentence 1: just synthesized
      mockAudioService.synthesizeToPath
        .mockResolvedValueOnce({
          audioUrl: "https://storage.example.com/tts/6mockedhash/0.mp3",
          cached: true,
        })
        .mockResolvedValueOnce({
          audioUrl: "https://tts.example.com/shijie.mp3",
          cached: false,
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

      // Sentence 0: existing; Sentence 1: synthesized; Sentence 2: throws
      mockAudioService.synthesizeToPath
        .mockResolvedValueOnce({
          audioUrl: "https://storage.example.com/tts/9mockedhash/0.mp3",
          cached: true,
        })
        .mockResolvedValueOnce({
          audioUrl: "https://tts.example.com/shijie.mp3",
          cached: false,
        })
        .mockRejectedValueOnce(new Error("TTS quota exceeded"));

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

    it("should mark a sentence as failed when the primitive throws", async () => {
      const passage = makePassage([{ index: 0, text: "你好。" }]);

      mockAudioService.synthesizeToPath.mockRejectedValue(new Error("signing failed"));

      const result = await service.getPassageAudio(passage);

      expect(result.audioUrls[0]).toEqual({ url: "", source: "failed" });
    });
  });
});
