/**
 * @file modules/readers/services/__tests__/ReadersService.test.ts
 * @description Unit tests for ReadersService — getRawPassage and getPassageAudio
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { ReadersService } from "../ReadersService.js";
import { PassageNotFoundError } from "../../types/readers-errors.js";
import type { PassageRecord } from "../../types/readers.js";
import type { PassageAudioResponse } from "../../types/readers-audio.js";

describe("ReadersService", () => {
  let service: ReadersService;
  let mockRepository: any;
  let mockPassageGenService: any;
  let mockSegmenterService: any;
  let mockCacheService: any;
  let mockReadersAudioService: any;

  const mockPassage: PassageRecord = {
    id: "passage-1",
    hskLevel: 2,
    passageIndex: 0,
    title: "Test Topic",
    content: { sentences: [{ index: 0, text: "你好。" }] },
    wordCount: 1,
    knownWordRatio: 1.0,
    targetHskLevel: 2,
    generatedById: null,
    generatedAt: new Date("2026-07-01"),
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
  };

  beforeEach(() => {
    mockRepository = {
      findPassageById: vi.fn(),
      findPassages: vi.fn(),
      countUserGeneratedToday: vi.fn(),
      countUserGenerated: vi.fn(),
      createPassage: vi.fn(),
      incrementAccessCount: vi.fn(),
      getUserCharacterCoverage: vi.fn(),
      getMaxPassageIndex: vi.fn(),
    };

    mockPassageGenService = {
      generatePassage: vi.fn(),
    };

    mockSegmenterService = {
      segment: vi.fn(),
      getHskProfile: vi.fn(),
      enrichSentences: vi.fn(),
      getWordHskLevel: vi.fn(),
    };

    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
    };

    mockReadersAudioService = {
      getPassageAudio: vi.fn(),
    };

    service = new ReadersService(
      mockRepository,
      mockPassageGenService,
      mockSegmenterService,
      mockCacheService,
      mockReadersAudioService,
    );
  });

  describe("getRawPassage", () => {
    it("should return null when passage is not found", async () => {
      mockRepository.findPassageById.mockResolvedValue(null);

      const result = await service.getRawPassage("nonexistent");

      expect(result).toBeNull();
      expect(mockRepository.findPassageById).toHaveBeenCalledWith("nonexistent");
    });

    it("should return PassageRecord when passage exists", async () => {
      mockRepository.findPassageById.mockResolvedValue(mockPassage);

      const result = await service.getRawPassage("passage-1");

      expect(result).toEqual(mockPassage);
      expect(mockRepository.findPassageById).toHaveBeenCalledWith("passage-1");
    });
  });

  describe("getPassageAudio", () => {
    it("should throw PassageNotFoundError when passage does not exist", async () => {
      mockRepository.findPassageById.mockResolvedValue(null);

      await expect(service.getPassageAudio("nonexistent")).rejects.toThrow(PassageNotFoundError);
      expect(mockReadersAudioService.getPassageAudio).not.toHaveBeenCalled();
    });

    it("should delegate to ReadersAudioService when passage exists", async () => {
      const mockAudioResponse: PassageAudioResponse = {
        audioUrls: {
          0: { url: "https://storage.example.com/audio.mp3", source: "gcs" },
        },
      };

      mockRepository.findPassageById.mockResolvedValue(mockPassage);
      mockReadersAudioService.getPassageAudio.mockResolvedValue(mockAudioResponse);

      const result = await service.getPassageAudio("passage-1");

      expect(result).toEqual(mockAudioResponse);
      expect(mockRepository.findPassageById).toHaveBeenCalledWith("passage-1");
      expect(mockReadersAudioService.getPassageAudio).toHaveBeenCalledWith(mockPassage);
    });
  });
});
