/**
 * @file apps/backend/src/modules/chengyu/services/__tests__/ChengyuService.test.ts
 * @description Unit tests for ChengyuService — validation + error + mapping.
 *
 * Story 23.2 — Chengyu Backend API. The service is the single source of
 * truth for filter/pagination validation: theme/era must be non-empty
 * strings, page ≥ 1, pageSize ∈ 1–100 (bounds mirror shared-constants
 * `PAGINATION`). Invalid values throw ChengyuValidationError; a missing
 * idiom throws ChengyuNotFoundError.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChengyuService } from "../ChengyuService.js";
import { PAGINATION } from "@mandarin/shared-constants";
import {
  ChengyuNotFoundError,
  ChengyuValidationError,
  type ChengyuListQuery,
  type ChengyuDetail,
} from "../../types/chengyu.js";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

describe("ChengyuService", () => {
  let service: ChengyuService;
  let mockRepository: {
    findIdioms: ReturnType<typeof vi.fn>;
    findByContentId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findIdioms: vi.fn(),
      findByContentId: vi.fn(),
    };
    service = new ChengyuService(mockRepository as never);
  });

  describe("listIdioms", () => {
    it("delegates a valid query to the repository and returns the list envelope", async () => {
      mockRepository.findIdioms.mockResolvedValue({ items: [], total: 55 });

      const result = await service.listIdioms({ theme: "determination", page: 1, pageSize: 20 });

      expect(mockRepository.findIdioms).toHaveBeenCalledWith({
        search: undefined,
        theme: "determination",
        era: undefined,
        page: 1,
        pageSize: 20,
      });
      expect(result).toEqual({ items: [], total: 55, page: 1, pageSize: 20 });
    });

    it("defaults page → 1 and pageSize → PAGINATION.DEFAULT_PAGE_SIZE when omitted", async () => {
      mockRepository.findIdioms.mockResolvedValue({ items: [], total: 0 });

      await service.listIdioms({});

      expect(mockRepository.findIdioms).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
      );
    });

    it("passes search, theme and era through to the repository", async () => {
      mockRepository.findIdioms.mockResolvedValue({ items: [], total: 1 });

      await service.listIdioms({
        search: "破釜沉舟",
        theme: "determination",
        era: "Qin–Han transition",
        page: 2,
        pageSize: 10,
      });

      expect(mockRepository.findIdioms).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "破釜沉舟",
          theme: "determination",
          era: "Qin–Han transition",
          page: 2,
          pageSize: 10,
        }),
      );
    });

    it.each(["", "   ", "  \t "])(
      "rejects empty/whitespace theme %j with VALIDATION_ERROR",
      async (theme) => {
        await expect(service.listIdioms({ theme })).rejects.toBeInstanceOf(ChengyuValidationError);
        expect(mockRepository.findIdioms).not.toHaveBeenCalled();
      },
    );

    it.each(["", "   "])("rejects empty/whitespace era %j with VALIDATION_ERROR", async (era) => {
      await expect(service.listIdioms({ era })).rejects.toBeInstanceOf(ChengyuValidationError);
    });

    it("rejects a non-string theme value with VALIDATION_ERROR", async () => {
      await expect(service.listIdioms({ theme: 42 as never })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
    });

    it("rejects page < 1 with VALIDATION_ERROR", async () => {
      await expect(service.listIdioms({ page: 0 })).rejects.toBeInstanceOf(ChengyuValidationError);
      await expect(service.listIdioms({ page: -3 })).rejects.toBeInstanceOf(ChengyuValidationError);
    });

    it("rejects pageSize outside 1–100 with VALIDATION_ERROR", async () => {
      await expect(service.listIdioms({ pageSize: 0 })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
      await expect(
        service.listIdioms({ pageSize: PAGINATION.MAX_PAGE_SIZE + 1 }),
      ).rejects.toBeInstanceOf(ChengyuValidationError);
    });

    it("rejects non-integer page/pageSize with VALIDATION_ERROR", async () => {
      await expect(service.listIdioms({ page: 1.5 })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
      await expect(service.listIdioms({ pageSize: 20.5 })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
    });

    it("rejects an invalid value even when other valid filters are present", async () => {
      await expect(service.listIdioms({ search: "好", era: "  ", page: 1 })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
    });
  });

  describe("getIdiom", () => {
    const detailRow = {
      content_id: "cy_0001",
      chengyu: "破釜沉舟",
      pinyin: "pò fǔ chén zhōu",
      literalMeaning: "Break the pots and sink the boats",
      figurativeMeaning: "To burn one's bridges",
      story: "In 207 BCE, Xiang Yu ordered the boats sunk and the pots smashed…",
      storySource: "《史记·卷七·项羽本纪》",
      era: "Qin–Han transition",
      theme: "determination",
      sortOrder: 1,
      examples: [
        {
          content_id: "cy_0001_ex1",
          chinese: "他已经决定要破釜沉舟，全力投入新的工作。",
          pinyin: "tā yǐ jīng jué dìng yào pò fǔ chén zhōu",
          english: "He has decided to burn his bridges.",
          sortOrder: 1,
          segments: [
            {
              text: "破",
              pinyin: "pò",
              gloss: "break",
              entityType: "character",
              entityId: "ch_30772",
            },
          ],
        },
        {
          content_id: "cy_0001_ex2",
          chinese: "这次我们只能破釜沉舟了。",
          pinyin: "zhè cì wǒmen zhǐ néng pò fǔ chén zhōu le",
          english: "This time we have no choice but to burn our bridges.",
          sortOrder: 2,
          segments: [],
        },
      ],
      relatedFrom: [
        {
          relationType: "RELATED",
          toChengyu: { content_id: "cy_0042", chengyu: "孤注一掷" },
        },
        { relationType: "RELATED", toChengyu: null },
      ],
    };

    it("maps a found idiom to the API detail shape (id = content_id, examples + relatedIdioms)", async () => {
      mockRepository.findByContentId.mockResolvedValue(detailRow);

      const result: ChengyuDetail = await service.getIdiom("cy_0001");

      expect(mockRepository.findByContentId).toHaveBeenCalledWith("cy_0001");
      expect(result).toEqual({
        id: "cy_0001",
        chengyu: "破釜沉舟",
        pinyin: "pò fǔ chén zhōu",
        literalMeaning: "Break the pots and sink the boats",
        figurativeMeaning: "To burn one's bridges",
        story: "In 207 BCE, Xiang Yu ordered the boats sunk and the pots smashed…",
        storySource: "《史记·卷七·项羽本纪》",
        era: "Qin–Han transition",
        theme: "determination",
        sortOrder: 1,
        examples: [
          {
            id: "cy_0001_ex1",
            chinese: "他已经决定要破釜沉舟，全力投入新的工作。",
            pinyin: "tā yǐ jīng jué dìng yào pò fǔ chén zhōu",
            english: "He has decided to burn his bridges.",
            segments: [
              {
                text: "破",
                pinyin: "pò",
                gloss: "break",
                entityType: "character",
                entityId: "ch_30772",
              },
            ],
          },
          {
            id: "cy_0001_ex2",
            chinese: "这次我们只能破釜沉舟了。",
            pinyin: "zhè cì wǒmen zhǐ néng pò fǔ chén zhōu le",
            english: "This time we have no choice but to burn our bridges.",
            segments: [],
          },
        ],
        // null toChengyu rows are filtered out
        relatedIdioms: [{ id: "cy_0042", chengyu: "孤注一掷", relationType: "RELATED" }],
      });
    });

    it("coerces non-array segments to an empty array (Epic 22 data resilience)", async () => {
      mockRepository.findByContentId.mockResolvedValue({
        ...detailRow,
        examples: [{ ...detailRow.examples[0], segments: null }],
      });

      const result = await service.getIdiom("cy_0001");
      expect(result.examples[0].segments).toEqual([]);
    });

    it("throws ChengyuNotFoundError when the idiom is missing", async () => {
      mockRepository.findByContentId.mockResolvedValue(null);

      await expect(service.getIdiom("cy_9999")).rejects.toBeInstanceOf(ChengyuNotFoundError);
      await expect(service.getIdiom("cy_9999")).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Failed to load chengyu idiom",
      });
    });
  });

  // Keep the query type referenced so the file stays in sync with the contract.
  describe("query type", () => {
    it("accepts an empty query (unfiltered browse)", async () => {
      mockRepository.findIdioms.mockResolvedValue({ items: [], total: 0 });
      const query: ChengyuListQuery = {};
      await expect(service.listIdioms(query)).resolves.toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });
  });
});
