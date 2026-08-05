/**
 * @file apps/backend/src/modules/grammar/services/__tests__/GrammarService.test.ts
 * @description Unit tests for GrammarService — validation + error + mapping.
 *
 * Story 22.2 — Grammar Backend API. The service is the single source of
 * truth for filter/pagination validation: phase ∈ {2,3,4}, hskLevel ∈ 1–6,
 * page ≥ 1, pageSize ∈ 1–100 (bounds mirror shared-constants `PAGINATION`).
 * Invalid values throw GrammarValidationError; a missing pattern throws
 * GrammarNotFoundError.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GrammarService } from "../GrammarService.js";
import { PAGINATION } from "@mandarin/shared-constants";
import {
  GrammarNotFoundError,
  GrammarValidationError,
  type GrammarListQuery,
  type GrammarPatternDetail,
} from "../../types/grammar.js";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const DEFAULT_PAGE_SIZE = PAGINATION.DEFAULT_PAGE_SIZE;

describe("GrammarService", () => {
  let service: GrammarService;
  let mockRepository: {
    findPatterns: ReturnType<typeof vi.fn>;
    findByContentId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepository = {
      findPatterns: vi.fn(),
      findByContentId: vi.fn(),
    };
    service = new GrammarService(mockRepository as never);
  });

  describe("listPatterns", () => {
    it("delegates a valid query to the repository and returns the list envelope", async () => {
      mockRepository.findPatterns.mockResolvedValue({ items: [], total: 9 });

      const result = await service.listPatterns({ phase: 2, page: 1, pageSize: 20 });

      expect(mockRepository.findPatterns).toHaveBeenCalledWith({
        search: undefined,
        hskLevel: undefined,
        phase: 2,
        page: 1,
        pageSize: 20,
      });
      expect(result).toEqual({ items: [], total: 9, page: 1, pageSize: 20 });
    });

    it("defaults page → 1 and pageSize → PAGINATION.DEFAULT_PAGE_SIZE when omitted", async () => {
      mockRepository.findPatterns.mockResolvedValue({ items: [], total: 0 });

      await service.listPatterns({});

      expect(mockRepository.findPatterns).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
      );
    });

    it("passes search and hskLevel through to the repository", async () => {
      mockRepository.findPatterns.mockResolvedValue({ items: [], total: 1 });

      await service.listPatterns({ search: "disposal", hskLevel: 4, page: 2, pageSize: 10 });

      expect(mockRepository.findPatterns).toHaveBeenCalledWith(
        expect.objectContaining({ search: "disposal", hskLevel: 4, page: 2, pageSize: 10 }),
      );
    });

    it.each([0, 1, 5])("rejects phase %d (∉ {2,3,4}) with VALIDATION_ERROR", async (phase) => {
      await expect(service.listPatterns({ phase })).rejects.toBeInstanceOf(GrammarValidationError);
      expect(mockRepository.findPatterns).not.toHaveBeenCalled();
    });

    it.each([2, 3, 4])("accepts phase %d", async (phase) => {
      mockRepository.findPatterns.mockResolvedValue({ items: [], total: 0 });
      await expect(service.listPatterns({ phase })).resolves.toBeDefined();
    });

    it.each([0, 7, 1.5])("rejects hskLevel %d (∉ 1–6) with VALIDATION_ERROR", async (hskLevel) => {
      await expect(service.listPatterns({ hskLevel })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
    });

    it("rejects page < 1 with VALIDATION_ERROR", async () => {
      await expect(service.listPatterns({ page: 0 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
      await expect(service.listPatterns({ page: -3 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
    });

    it("rejects pageSize outside 1–100 with VALIDATION_ERROR", async () => {
      await expect(service.listPatterns({ pageSize: 0 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
      await expect(
        service.listPatterns({ pageSize: PAGINATION.MAX_PAGE_SIZE + 1 }),
      ).rejects.toBeInstanceOf(GrammarValidationError);
    });

    it("rejects non-integer page/pageSize with VALIDATION_ERROR", async () => {
      await expect(service.listPatterns({ page: 1.5 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
      await expect(service.listPatterns({ pageSize: 20.5 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
    });

    it("rejects an invalid value even when other valid filters are present", async () => {
      await expect(
        service.listPatterns({ search: "好", phase: 5, page: 1 }),
      ).rejects.toBeInstanceOf(GrammarValidationError);
    });
  });

  describe("getPattern", () => {
    const detailRow = {
      content_id: "gr_0018",
      name: "把 (bǎ) disposal construction",
      structure: "Subject + 把 + Object + Verb + Complement",
      explanation: "The 把 (bǎ) construction moves the object before the verb…",
      phase: 4,
      hskLevel: 4,
      sortOrder: 18,
      examples: [
        {
          content_id: "gr_0018_ex1",
          chinese: "我把书放在桌子上。",
          pinyin: "wǒ bǎ shū fàng zài zhuōzi shàng",
          english: "I put the book on the table.",
          sortOrder: 1,
          segments: [
            { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
          ],
        },
        {
          content_id: "gr_0018_ex2",
          chinese: "他把衣服洗了。",
          pinyin: "tā bǎ yīfu xǐ le",
          english: "He washed the clothes.",
          sortOrder: 2,
          segments: [],
        },
      ],
      relatedFrom: [
        {
          relationType: "CONTRASTS_WITH",
          toPattern: { content_id: "gr_0019", name: "被 (bèi) passive construction" },
        },
        { relationType: "RELATED", toPattern: null },
      ],
    };

    it("maps a found pattern to the API detail shape (id = content_id, examples + relatedPatterns)", async () => {
      mockRepository.findByContentId.mockResolvedValue(detailRow);

      const result: GrammarPatternDetail = await service.getPattern("gr_0018");

      expect(mockRepository.findByContentId).toHaveBeenCalledWith("gr_0018");
      expect(result).toEqual({
        id: "gr_0018",
        name: "把 (bǎ) disposal construction",
        structure: "Subject + 把 + Object + Verb + Complement",
        explanation: "The 把 (bǎ) construction moves the object before the verb…",
        phase: 4,
        hskLevel: 4,
        sortOrder: 18,
        examples: [
          {
            id: "gr_0018_ex1",
            chinese: "我把书放在桌子上。",
            pinyin: "wǒ bǎ shū fàng zài zhuōzi shàng",
            english: "I put the book on the table.",
            segments: [
              {
                text: "我",
                pinyin: "wǒ",
                gloss: "I",
                entityType: "character",
                entityId: "ch_25105",
              },
            ],
          },
          {
            id: "gr_0018_ex2",
            chinese: "他把衣服洗了。",
            pinyin: "tā bǎ yīfu xǐ le",
            english: "He washed the clothes.",
            segments: [],
          },
        ],
        // null toPattern rows are filtered out
        relatedPatterns: [
          { id: "gr_0019", name: "被 (bèi) passive construction", relationType: "CONTRASTS_WITH" },
        ],
      });
    });

    it("coerces non-array segments to an empty array (data resilience)", async () => {
      mockRepository.findByContentId.mockResolvedValue({
        ...detailRow,
        examples: [{ ...detailRow.examples[0], segments: "not-an-array" }],
      });

      const result = await service.getPattern("gr_0018");
      expect(result.examples[0].segments).toEqual([]);
    });

    it("throws GrammarNotFoundError when the pattern is missing", async () => {
      mockRepository.findByContentId.mockResolvedValue(null);

      await expect(service.getPattern("gr_9999")).rejects.toBeInstanceOf(GrammarNotFoundError);
      await expect(service.getPattern("gr_9999")).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Failed to load grammar pattern",
      });
    });
  });

  // Keep the query type referenced so the file stays in sync with the contract.
  describe("query type", () => {
    it("accepts an empty query (unfiltered browse)", async () => {
      mockRepository.findPatterns.mockResolvedValue({ items: [], total: 0 });
      const query: GrammarListQuery = {};
      await expect(service.listPatterns(query)).resolves.toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      });
    });
  });
});
