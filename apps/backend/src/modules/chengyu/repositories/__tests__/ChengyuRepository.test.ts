/**
 * @file apps/backend/src/modules/chengyu/repositories/__tests__/ChengyuRepository.test.ts
 * @description Unit tests for ChengyuRepository — filter building + pagination math.
 *
 * Story 23.2 — Chengyu Backend API. Verifies the `where` clause is built
 * additively (search across chengyu/pinyin/literalMeaning/figurativeMeaning/
 * story + example english/pinyin; exact theme; exact era) and that pagination
 * maps to the Prisma skip/take correctly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    chengyu: {
      findMany: mockFindMany,
      count: mockCount,
      findUnique: mockFindUnique,
    },
  },
}));

const { ChengyuRepository } = await import("../ChengyuRepository.js");
type ChengyuRepositoryInstance = InstanceType<typeof ChengyuRepository>;

describe("ChengyuRepository", () => {
  let repository: ChengyuRepositoryInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockFindUnique.mockReset();
    repository = new ChengyuRepository();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    mockFindUnique.mockResolvedValue(null);
  });

  describe("findIdioms", () => {
    it("builds no where clause for an unfiltered query", async () => {
      await repository.findIdioms({ page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where).toEqual({});
      expect(mockCount).toHaveBeenCalledWith({ where: {} });
    });

    it("builds a case-insensitive OR search across idiom/pinyin/meanings/story + example english/pinyin", async () => {
      await repository.findIdioms({ search: "burn", page: 1, pageSize: 20 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { chengyu: { contains: "burn", mode: "insensitive" } },
        { pinyin: { contains: "burn", mode: "insensitive" } },
        { literalMeaning: { contains: "burn", mode: "insensitive" } },
        { figurativeMeaning: { contains: "burn", mode: "insensitive" } },
        { story: { contains: "burn", mode: "insensitive" } },
        {
          examples: {
            some: {
              OR: [
                { english: { contains: "burn", mode: "insensitive" } },
                { pinyin: { contains: "burn", mode: "insensitive" } },
              ],
            },
          },
        },
      ]);
    });

    it("applies exact theme and era filters when provided", async () => {
      await repository.findIdioms({
        theme: "determination",
        era: "Qin–Han transition",
        page: 1,
        pageSize: 20,
      });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.theme).toBe("determination");
      expect(where.era).toBe("Qin–Han transition");
    });

    it("combines search + theme + era additively", async () => {
      await repository.findIdioms({
        search: "破釜沉舟",
        theme: "determination",
        era: "Qin–Han transition",
        page: 1,
        pageSize: 20,
      });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
      expect(where.theme).toBe("determination");
      expect(where.era).toBe("Qin–Han transition");
    });

    it("does not set theme/era when omitted (no default values injected)", async () => {
      await repository.findIdioms({ search: "好", page: 2, pageSize: 10 });

      const where = mockFindMany.mock.calls[0][0].where;
      expect(where).not.toHaveProperty("theme");
      expect(where).not.toHaveProperty("era");
    });

    it("maps pagination to skip/take and orders by sortOrder", async () => {
      await repository.findIdioms({ page: 3, pageSize: 25 });

      const args = mockFindMany.mock.calls[0][0];
      expect(args.skip).toBe((3 - 1) * 25);
      expect(args.take).toBe(25);
      expect(args.orderBy).toEqual({ sortOrder: "asc" });
    });

    it("maps rows to summaries (id = content_id, exampleCount, previewExample from first example)", async () => {
      mockFindMany.mockResolvedValue([
        {
          content_id: "cy_0001",
          chengyu: "破釜沉舟",
          pinyin: "pò fǔ chén zhōu",
          literalMeaning: "Break the pots and sink the boats",
          figurativeMeaning: "To burn one's bridges",
          era: "Qin–Han transition",
          theme: "determination",
          sortOrder: 1,
          _count: { examples: 1 },
          examples: [{ chinese: "他已经决定要破釜沉舟，全力投入新的工作。" }],
        },
      ]);
      mockCount.mockResolvedValue(55);

      const result = await repository.findIdioms({ page: 1, pageSize: 20 });

      expect(result.total).toBe(55);
      expect(result.items).toEqual([
        {
          id: "cy_0001",
          chengyu: "破釜沉舟",
          pinyin: "pò fǔ chén zhōu",
          literalMeaning: "Break the pots and sink the boats",
          figurativeMeaning: "To burn one's bridges",
          era: "Qin–Han transition",
          theme: "determination",
          sortOrder: 1,
          exampleCount: 1,
          previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
        },
      ]);
    });

    it("returns null previewExample when an idiom has no examples", async () => {
      mockFindMany.mockResolvedValue([
        {
          content_id: "cy_0099",
          chengyu: "无中生有",
          pinyin: "wú zhōng shēng yǒu",
          literalMeaning: "Create something from nothing",
          figurativeMeaning: "To fabricate",
          era: "—",
          theme: "—",
          sortOrder: 99,
          _count: { examples: 0 },
          examples: [],
        },
      ]);

      const result = await repository.findIdioms({ page: 1, pageSize: 20 });
      expect(result.items[0].exampleCount).toBe(0);
      expect(result.items[0].previewExample).toBeNull();
    });
  });

  describe("findByContentId", () => {
    it("resolves by the unique content_id and includes ordered examples + relatedFrom→toChengyu", async () => {
      mockFindUnique.mockResolvedValue({ content_id: "cy_0001" });

      await repository.findByContentId("cy_0001");

      const args = mockFindUnique.mock.calls[0][0];
      expect(args.where).toEqual({ content_id: "cy_0001" });
      expect(args.include.examples.orderBy).toEqual({ sortOrder: "asc" });
      expect(args.include.relatedFrom.include.toChengyu.select).toEqual({
        content_id: true,
        chengyu: true,
      });
    });

    it("returns null when the content_id is unknown", async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await repository.findByContentId("cy_9999");
      expect(result).toBeNull();
    });
  });
});
