/**
 * @file apps/backend/src/modules/grammar/repositories/__tests__/GrammarRepository.test.ts
 * @description Unit tests for GrammarRepository — filter building + pagination math.
 *
 * Story 22.2 — Grammar Backend API. Verifies the `where` clause is built
 * additively (search across name/structure/explanation + example
 * english/pinyin; exact hskLevel; exact phase) and that pagination maps to
 * the Prisma skip/take correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    grammarPattern: {
      findMany: mockFindMany,
      count: mockCount,
      findUnique: mockFindUnique,
    },
  },
}));

const { GrammarRepository } = await import("../GrammarRepository.js");
type GrammarRepositoryInstance = InstanceType<typeof GrammarRepository>;

describe("GrammarRepository", () => {
  let repository: GrammarRepositoryInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockFindUnique.mockReset();
    repository = new GrammarRepository();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    mockFindUnique.mockResolvedValue(null);
  });

  describe("findPatterns", () => {
    it("builds no where clause for an unfiltered query", async () => {
      await repository.findPatterns({ page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where).toEqual({});
      expect(mockCount).toHaveBeenCalledWith({ where: {} });
    });

    it("builds a case-insensitive OR search across name/structure/explanation + example english/pinyin", async () => {
      await repository.findPatterns({ search: "disposal", page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { name: { contains: "disposal", mode: "insensitive" } },
        { structure: { contains: "disposal", mode: "insensitive" } },
        { explanation: { contains: "disposal", mode: "insensitive" } },
        {
          examples: {
            some: {
              OR: [
                { english: { contains: "disposal", mode: "insensitive" } },
                { pinyin: { contains: "disposal", mode: "insensitive" } },
              ],
            },
          },
        },
      ]);
    });

    it("applies exact hskLevel and phase filters when provided", async () => {
      await repository.findPatterns({ hskLevel: 4, phase: 4, page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.hskLevel).toBe(4);
      expect(where.phase).toBe(4);
    });

    it("combines search + hskLevel + phase additively", async () => {
      await repository.findPatterns({ search: "把", hskLevel: 4, phase: 4, page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
      expect(where.hskLevel).toBe(4);
      expect(where.phase).toBe(4);
    });

    it("does not set hskLevel/phase when omitted (no default values injected)", async () => {
      await repository.findPatterns({ search: "好", page: 2, pageSize: 10 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where).not.toHaveProperty("hskLevel");
      expect(where).not.toHaveProperty("phase");
    });

    it("maps pagination to skip/take and orders by phase then sortOrder", async () => {
      await repository.findPatterns({ page: 3, pageSize: 25 });

      const args = mockFindMany.mock.calls[0][0];
      expect(args.skip).toBe((3 - 1) * 25);
      expect(args.take).toBe(25);
      expect(args.orderBy).toEqual([{ phase: "asc" }, { sortOrder: "asc" }]);
    });

    it("maps rows to summaries (id = content_id, exampleCount, previewExample from first example)", async () => {
      mockFindMany.mockResolvedValue([
        {
          content_id: "gr_0005",
          name: "吗 yes/no questions",
          structure: "Statement + 吗？",
          phase: 2,
          hskLevel: 1,
          sortOrder: 5,
          _count: { examples: 3 },
          examples: [{ chinese: "你好吗？" }],
        },
      ]);
      mockCount.mockResolvedValue(9);

      const result = await repository.findPatterns({ page: 1, pageSize: 20 });

      expect(result.total).toBe(9);
      expect(result.items).toEqual([
        {
          id: "gr_0005",
          name: "吗 yes/no questions",
          structure: "Statement + 吗？",
          phase: 2,
          hskLevel: 1,
          sortOrder: 5,
          exampleCount: 3,
          previewExample: "你好吗？",
        },
      ]);
    });

    it("returns null previewExample when a pattern has no examples", async () => {
      mockFindMany.mockResolvedValue([
        {
          content_id: "gr_0099",
          name: "No examples",
          structure: "—",
          phase: 2,
          hskLevel: null,
          sortOrder: 99,
          _count: { examples: 0 },
          examples: [],
        },
      ]);

      const result = await repository.findPatterns({ page: 1, pageSize: 20 });
      expect(result.items[0].exampleCount).toBe(0);
      expect(result.items[0].previewExample).toBeNull();
    });
  });

  describe("findByContentId", () => {
    it("resolves by the unique content_id and includes ordered examples + relatedFrom→toPattern", async () => {
      mockFindUnique.mockResolvedValue({ content_id: "gr_0018" });

      await repository.findByContentId("gr_0018");

      const args = mockFindUnique.mock.calls[0][0];
      expect(args.where).toEqual({ content_id: "gr_0018" });
      expect(args.include.examples.orderBy).toEqual({ sortOrder: "asc" });
      expect(args.include.relatedFrom.include.toPattern.select).toEqual({
        content_id: true,
        name: true,
      });
    });

    it("returns null when the content_id is unknown", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await repository.findByContentId("gr_9999");
      expect(result).toBeNull();
    });
  });
});
