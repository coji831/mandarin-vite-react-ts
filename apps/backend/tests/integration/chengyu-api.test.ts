/**
 * @file apps/backend/tests/integration/chengyu-api.test.ts
 * @description DB-backed integration tests for the Chengyu API module
 * (Story 23.2 — Chengyu Backend API). Exercises ChengyuRepository +
 * ChengyuService against the SEEDED chengyu tables (55 idioms / 55 examples /
 * 18 relations, all-in-DB from Story 23.1).
 *
 * Covers: list filters (theme / era / search across idiom, pinyin, meanings,
 * story and example english/pinyin) + pagination; detail-by-content_id
 * (ordered examples + relatedIdioms); empty-result 404 (ChengyuNotFoundError);
 * validation 400s; and idempotency (repeated identical calls).
 *
 * Seed re-run idempotency is covered by tests/integration/chengyu-seed.test.ts
 * (Story 23.1); this suite focuses on the 23.2 API surface.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { ChengyuRepository } from "../../src/modules/chengyu/repositories/ChengyuRepository.js";
import { ChengyuService } from "../../src/modules/chengyu/services/ChengyuService.js";
import {
  ChengyuNotFoundError,
  ChengyuValidationError,
} from "../../src/modules/chengyu/types/chengyu.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("Chengyu API (integration, DB)", () => {
  let repository: ChengyuRepository;
  let service: ChengyuService;

  beforeAll(() => {
    repository = new ChengyuRepository();
    service = new ChengyuService(repository);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("ChengyuRepository.findIdioms", () => {
    it("returns the full library paginated when unfiltered (no 'at least one filter' requirement)", async () => {
      const { items, total } = await repository.findIdioms({ page: 1, pageSize: 100 });

      expect(total).toBeGreaterThanOrEqual(50);
      expect(items.length).toBe(total);
      // Ordered by sortOrder asc (stable library ordering)
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].sortOrder).toBeLessThanOrEqual(items[i].sortOrder);
      }
    });

    it("filters by theme (exact, additive)", async () => {
      const { items, total } = await repository.findIdioms({
        theme: "determination",
        page: 1,
        pageSize: 100,
      });

      expect(total).toBeGreaterThan(0);
      expect(items.every((i) => i.theme === "determination")).toBe(true);
      expect(items.some((i) => i.id === "cy_0001")).toBe(true);
    });

    it("filters by era (exact)", async () => {
      const { items } = await repository.findIdioms({
        era: "Spring & Autumn",
        page: 1,
        pageSize: 100,
      });

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((i) => i.era === "Spring & Autumn")).toBe(true);
      expect(items.some((i) => i.id === "cy_0005")).toBe(true);
    });

    it("search matches the idiom itself (case-insensitive contains)", async () => {
      const { items } = await repository.findIdioms({
        search: "破釜沉舟",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "cy_0001")).toBe(true);
    });

    it("search matches example english", async () => {
      const { items } = await repository.findIdioms({
        search: "burn his bridges",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "cy_0001")).toBe(true);
    });

    it("search matches example pinyin", async () => {
      const { items } = await repository.findIdioms({
        search: "pò fǔ chén zhōu",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "cy_0001")).toBe(true);
    });

    it("applies pagination math while total reflects the full match set", async () => {
      const allDetermination = await repository.findIdioms({
        theme: "determination",
        page: 1,
        pageSize: 100,
      });
      const firstPage = await repository.findIdioms({
        theme: "determination",
        page: 1,
        pageSize: 5,
      });

      expect(firstPage.items.length).toBeLessThanOrEqual(5);
      expect(firstPage.total).toBe(allDetermination.total);

      if (allDetermination.total > 5) {
        const secondPage = await repository.findIdioms({
          theme: "determination",
          page: 2,
          pageSize: 5,
        });
        expect(secondPage.items.length).toBeGreaterThan(0);
        // No overlap between pages 1 and 2
        const page1Ids = new Set(firstPage.items.map((i) => i.id));
        expect(secondPage.items.some((i) => page1Ids.has(i.id))).toBe(false);
      }
    });
  });

  describe("ChengyuRepository.findByContentId", () => {
    it("resolves cy_0001 with ordered examples + relatedIdioms", async () => {
      const row = await repository.findByContentId("cy_0001");

      expect(row).not.toBeNull();
      expect(row!.content_id).toBe("cy_0001");
      expect(row!.chengyu).toBe("破釜沉舟");
      expect(row!.examples.length).toBeGreaterThanOrEqual(1);
      // Examples ordered by sortOrder asc
      const orders = row!.examples.map((e) => e.sortOrder);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
      // relatedFrom → toChengyu includes cy_0042 + cy_0016 (RELATED)
      const relatedIds = row!.relatedFrom
        .filter((r) => r.toChengyu !== null)
        .map((r) => r.toChengyu!.content_id);
      expect(relatedIds).toContain("cy_0042");
      expect(relatedIds).toContain("cy_0016");
    });

    it("returns null for an unknown content_id", async () => {
      expect(await repository.findByContentId("cy_9999")).toBeNull();
    });
  });

  describe("ChengyuService", () => {
    it("listIdioms returns the list envelope { items, total, page, pageSize }", async () => {
      const result = await service.listIdioms({ theme: "determination", page: 1, pageSize: 10 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(10);
    });

    it("getIdiom maps the detail by content_id (id = content_id, examples with segments, relatedIdioms)", async () => {
      const detail = await service.getIdiom("cy_0001");

      expect(detail.id).toBe("cy_0001");
      expect(detail.chengyu).toBe("破釜沉舟");
      expect(detail.theme).toBe("determination");
      expect(detail.era).toBe("Qin–Han transition");
      expect(detail.examples.length).toBeGreaterThan(0);
      expect(detail.examples[0].id).toMatch(/^cy_0001_ex/);
      expect(Array.isArray(detail.examples[0].segments)).toBe(true);
      expect(
        detail.relatedIdioms.some(
          (r) => (r.id === "cy_0042" || r.id === "cy_0016") && r.relationType === "RELATED",
        ),
      ).toBe(true);
    });

    it("throws ChengyuNotFoundError for a missing content_id (empty-result 404)", async () => {
      await expect(service.getIdiom("cy_9999")).rejects.toBeInstanceOf(ChengyuNotFoundError);
    });

    it("throws ChengyuValidationError for invalid filters (maps to 400)", async () => {
      await expect(service.listIdioms({ theme: "" })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
      await expect(service.listIdioms({ era: "   " })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
      await expect(service.listIdioms({ page: 0 })).rejects.toBeInstanceOf(ChengyuValidationError);
      await expect(service.listIdioms({ pageSize: 101 })).rejects.toBeInstanceOf(
        ChengyuValidationError,
      );
    });

    it("is idempotent — repeated identical list and detail calls return the same results", async () => {
      const a = await service.listIdioms({ theme: "determination", page: 1, pageSize: 10 });
      const b = await service.listIdioms({ theme: "determination", page: 1, pageSize: 10 });

      expect(b.total).toBe(a.total);
      expect(b.items).toEqual(a.items);

      const d1 = await service.getIdiom("cy_0001");
      const d2 = await service.getIdiom("cy_0001");
      expect(d2).toEqual(d1);
    });
  });
});
