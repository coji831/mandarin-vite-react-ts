/**
 * @file phoneticTreeService.test.ts
 * @description Tests for phoneticTreeService API calls
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPhoneticFamilies,
  enrichFamilyMembers,
  type PhoneticFamily,
} from "../phoneticTreeService";

type AxiosResponse<T> = { data: T };

const mockGet = vi.fn();

vi.mock("shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const SAMPLE_CLUSTER_RESPONSE = {
  data: [
    {
      id: "pc_0001",
      phoneticPattern: "青",
      pinyin: "qīng",
      description: "blue/green",
      pronunciationNote: "Tones vary by character",
      memberCount: 4,
      hskLevels: [2, 3],
      members: [
        { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 3 },
        { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2 },
        { glyph: "请", pinyin: "qǐng", meaning: "request", hskLevel: 2 },
        { glyph: "晴", pinyin: "qíng", meaning: "clear (sky)", hskLevel: 3 },
      ],
    },
  ],
};

const SAMPLE_FAMILY: PhoneticFamily = {
  id: "pc_0001",
  phoneticPattern: "青",
  pinyin: "qīng",
  description: "blue/green",
  pronunciationNote: null,
  memberCount: 3,
  hskLevels: [2, 3],
  members: [
    { glyph: "清", pinyin: "qīng", meaning: "clear", hskLevel: 3, classification: null },
    { glyph: "情", pinyin: "qíng", meaning: "feeling", hskLevel: 2, classification: null },
    { glyph: "请", pinyin: "qǐng", meaning: "request", hskLevel: 2, classification: null },
  ],
};

describe("phoneticTreeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPhoneticFamilies", () => {
    it("returns family data on success", async () => {
      mockGet.mockResolvedValue({
        data: SAMPLE_CLUSTER_RESPONSE,
      } as AxiosResponse<typeof SAMPLE_CLUSTER_RESPONSE>);

      const result = await getPhoneticFamilies();

      expect(result).toEqual(SAMPLE_CLUSTER_RESPONSE.data);
      expect(result).toHaveLength(1);
      expect(result[0].phoneticPattern).toBe("青");
      expect(mockGet).toHaveBeenCalledWith("/v1/phonetic-clusters", { timeout: 10000 });
    });

    it("handles API errors", async () => {
      mockGet.mockRejectedValue(new Error("Network error"));

      await expect(getPhoneticFamilies()).rejects.toThrow("Network error");
    });
  });

  describe("enrichFamilyMembers", () => {
    it("enriches members with classification data", async () => {
      // Each member's character detail request returns a classification
      mockGet
        .mockResolvedValueOnce({
          data: { glyph: "清", classification: "phono_semantic" },
        })
        .mockResolvedValueOnce({
          data: { glyph: "情", classification: "phono_semantic" },
        })
        .mockResolvedValueOnce({
          data: { glyph: "请", classification: "phono_semantic" },
        });

      const enriched = await enrichFamilyMembers(SAMPLE_FAMILY);

      expect(enriched.members).toHaveLength(3);
      expect(enriched.members[0].classification).toBe("phono_semantic");
      expect(enriched.members[1].classification).toBe("phono_semantic");
      expect(enriched.members[2].classification).toBe("phono_semantic");
    });

    it("handles character API errors gracefully (sets null classification)", async () => {
      // First member fails, second succeeds
      mockGet
        .mockRejectedValueOnce(new Error("Not found"))
        .mockResolvedValueOnce({
          data: { glyph: "情", classification: "phono_semantic" },
        })
        .mockResolvedValueOnce({
          data: { glyph: "请", classification: "compound_ideograph" },
        });

      const enriched = await enrichFamilyMembers(SAMPLE_FAMILY);

      expect(enriched.members).toHaveLength(3);
      expect(enriched.members[0].classification).toBeNull();
      expect(enriched.members[1].classification).toBe("phono_semantic");
      expect(enriched.members[2].classification).toBe("compound_ideograph");
    });
  });
});
