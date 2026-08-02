/**
 * @file services/__tests__/passageService.test.ts
 * @description Tests for passageService API calls
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPassages,
  fetchPassageDetail,
  generatePassage,
  fetchPassageAudio,
} from "../passageService";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

const SAMPLE_PASSAGES = [
  { id: "p1", title: "Passage 1", hskLevel: 2, knownWordRatio: 75, isBookmarked: false },
  { id: "p2", title: "Passage 2", hskLevel: 3, knownWordRatio: 60, isBookmarked: true },
];

const SAMPLE_DETAIL = {
  data: {
    id: "p1",
    title: "Passage 1",
    hskLevel: 2,
    sentences: [
      {
        index: 0,
        text: "你好。",
        pinyin: "nǐ hǎo.",
        words: [
          { glyph: "你", wordId: null, hskLevel: 1, pinyin: "nǐ", isKnown: true },
          { glyph: "好", wordId: null, hskLevel: 1, pinyin: "hǎo", isKnown: true },
          { glyph: "。", wordId: null, hskLevel: null, pinyin: null, isKnown: true },
        ],
      },
    ],
  },
};

describe("passageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPassages", () => {
    it("fetches all passages when no HSK level", async () => {
      mockGet.mockResolvedValue({ data: { data: SAMPLE_PASSAGES } });

      const result = await fetchPassages();

      expect(result).toEqual(SAMPLE_PASSAGES);
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/passages", {
        params: {},
        timeout: 10000,
      });
    });

    it("fetches passages filtered by HSK level", async () => {
      mockGet.mockResolvedValue({ data: { data: [SAMPLE_PASSAGES[0]] } });

      const result = await fetchPassages(2);

      expect(result).toEqual([SAMPLE_PASSAGES[0]]);
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/passages", {
        params: { hskLevel: 2 },
        timeout: 10000,
      });
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockGet.mockResolvedValue({ data: SAMPLE_PASSAGES });

      const result = await fetchPassages();

      expect(result).toEqual(SAMPLE_PASSAGES);
    });

    it("throws on network error", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(fetchPassages()).rejects.toThrow("Network error");
    });
  });

  describe("fetchPassageDetail", () => {
    it("fetches passage detail by id", async () => {
      mockGet.mockResolvedValue({ data: SAMPLE_DETAIL });

      const result = await fetchPassageDetail("p1");

      expect(result).toEqual(SAMPLE_DETAIL.data);
      expect(mockGet).toHaveBeenCalledWith("/v1/readers/passages/p1", { timeout: 10000 });
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockGet.mockResolvedValue({ data: SAMPLE_DETAIL.data });

      const result = await fetchPassageDetail("p1");

      expect(result).toEqual(SAMPLE_DETAIL.data);
    });

    it("throws on network error", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(fetchPassageDetail("p1")).rejects.toThrow("Network error");
    });
  });

  describe("generatePassage", () => {
    it("generates a passage with no HSK level", async () => {
      mockPost.mockResolvedValue({ data: { data: { id: "new-id" } } });

      const result = await generatePassage();

      expect(result).toEqual({ id: "new-id" });
      expect(mockPost).toHaveBeenCalledWith("/v1/readers/generate", {}, { timeout: 30000 });
    });

    it("generates a passage with HSK level", async () => {
      mockPost.mockResolvedValue({ data: { data: { id: "new-id" } } });

      const result = await generatePassage(3);

      expect(result).toEqual({ id: "new-id" });
      expect(mockPost).toHaveBeenCalledWith(
        "/v1/readers/generate",
        { hskLevel: 3 },
        { timeout: 30000 },
      );
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockPost.mockResolvedValue({ data: { id: "new-id" } });

      const result = await generatePassage();

      expect(result).toEqual({ id: "new-id" });
    });

    it("throws on network error", async () => {
      mockPost.mockRejectedValue(new Error("Generation failed"));

      await expect(generatePassage()).rejects.toThrow("Generation failed");
    });
  });

  describe("fetchPassageAudio", () => {
    const SAMPLE_AUDIO_RESPONSE = {
      data: {
        audioUrls: {
          0: { url: "https://example.com/audio/0.mp3", source: "gcs" },
          1: { url: "https://example.com/audio/1.mp3", source: "gcs" },
        },
      },
    };

    it("fetches audio URLs for a passage", async () => {
      mockPost.mockResolvedValue({ data: SAMPLE_AUDIO_RESPONSE });

      const result = await fetchPassageAudio("p1");

      expect(result).toEqual(SAMPLE_AUDIO_RESPONSE.data);
      expect(mockPost).toHaveBeenCalledWith(
        "/v1/readers/passages/p1/audio",
        {},
        { timeout: 30000 },
      );
    });

    it("falls back to response.data when data wrapper missing", async () => {
      mockPost.mockResolvedValue({ data: SAMPLE_AUDIO_RESPONSE.data });

      const result = await fetchPassageAudio("p1");

      expect(result).toEqual(SAMPLE_AUDIO_RESPONSE.data);
    });

    it("throws on network error", async () => {
      mockPost.mockRejectedValue(new Error("Audio fetch failed"));

      await expect(fetchPassageAudio("p1")).rejects.toThrow("Audio fetch failed");
    });
  });
});
