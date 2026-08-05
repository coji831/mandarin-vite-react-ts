/**
 * @file apps/backend/tests/integration/grammar-api.test.ts
 * @description DB-backed integration tests for the Grammar API module
 * (Story 22.2 — Grammar Backend API). Exercises GrammarRepository +
 * GrammarService against the SEEDED grammar tables (21 patterns / 63
 * examples / 12 relations, all-in-DB from Story 22.1).
 *
 * Covers: list filters (phase / hskLevel / search across name, structure,
 * explanation and example english/pinyin) + pagination; detail-by-content_id
 * (ordered examples + relatedPatterns); empty-result 404 (GrammarNotFoundError);
 * validation 400s; and idempotency (repeated identical calls).
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";
import { GrammarRepository } from "../../src/modules/grammar/repositories/GrammarRepository.js";
import { GrammarService } from "../../src/modules/grammar/services/GrammarService.js";
import {
  GrammarNotFoundError,
  GrammarValidationError,
} from "../../src/modules/grammar/types/grammar.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("Grammar API (integration, DB)", () => {
  let repository: GrammarRepository;
  let service: GrammarService;

  beforeAll(() => {
    repository = new GrammarRepository();
    service = new GrammarService(repository);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("GrammarRepository.findPatterns", () => {
    it("returns the full library paginated when unfiltered (no 'at least one filter' requirement)", async () => {
      const { items, total } = await repository.findPatterns({ page: 1, pageSize: 100 });

      expect(total).toBeGreaterThanOrEqual(21);
      expect(items.length).toBe(total);
      // Ordered by phase asc then sortOrder asc
      for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        expect(prev.phase <= curr.phase).toBe(true);
        if (prev.phase === curr.phase) expect(prev.sortOrder).toBeLessThan(curr.sortOrder);
      }
    });

    it("filters by phase (exact, additive)", async () => {
      const { items, total } = await repository.findPatterns({ phase: 2, page: 1, pageSize: 100 });

      expect(total).toBeGreaterThan(0);
      expect(items.every((i) => i.phase === 2)).toBe(true);
    });

    it("filters by hskLevel", async () => {
      const { items } = await repository.findPatterns({ hskLevel: 1, page: 1, pageSize: 100 });

      expect(items.length).toBeGreaterThan(0);
      expect(items.every((i) => i.hskLevel === 1)).toBe(true);
    });

    it("search matches the pattern name (case-insensitive contains)", async () => {
      const { items } = await repository.findPatterns({
        search: "disposal",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "gr_0018")).toBe(true);
    });

    it("search matches example english", async () => {
      const { items } = await repository.findPatterns({
        search: "I hit the person",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "gr_0001")).toBe(true);
    });

    it("search matches example pinyin", async () => {
      const { items } = await repository.findPatterns({
        search: "dǎ rén",
        page: 1,
        pageSize: 100,
      });

      expect(items.some((i) => i.id === "gr_0001")).toBe(true);
    });

    it("applies pagination math while total reflects the full match set", async () => {
      const allPhase2 = await repository.findPatterns({ phase: 2, page: 1, pageSize: 100 });
      const firstPage = await repository.findPatterns({ phase: 2, page: 1, pageSize: 5 });

      expect(firstPage.items.length).toBeLessThanOrEqual(5);
      expect(firstPage.total).toBe(allPhase2.total);

      if (allPhase2.total > 5) {
        const secondPage = await repository.findPatterns({ phase: 2, page: 2, pageSize: 5 });
        expect(secondPage.items.length).toBeGreaterThan(0);
        // No overlap between pages 1 and 2
        const page1Ids = new Set(firstPage.items.map((i) => i.id));
        expect(secondPage.items.some((i) => page1Ids.has(i.id))).toBe(false);
      }
    });
  });

  describe("GrammarRepository.findByContentId", () => {
    it("resolves gr_0018 with ordered examples + relatedPatterns", async () => {
      const row = await repository.findByContentId("gr_0018");

      expect(row).not.toBeNull();
      expect(row!.content_id).toBe("gr_0018");
      expect(row!.name).toContain("把");
      expect(row!.examples.length).toBeGreaterThanOrEqual(1);
      // Examples ordered by sortOrder asc
      const orders = row!.examples.map((e) => e.sortOrder);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
      // relatedFrom → toPattern gr_0019 (CONTRASTS_WITH)
      const related = row!.relatedFrom.filter((r) => r.toPattern?.content_id === "gr_0019");
      expect(related.length).toBeGreaterThan(0);
      expect(related[0].relationType).toBe("CONTRASTS_WITH");
    });

    it("returns null for an unknown content_id", async () => {
      expect(await repository.findByContentId("gr_9999")).toBeNull();
    });
  });

  describe("GrammarService", () => {
    it("listPatterns returns the list envelope { items, total, page, pageSize }", async () => {
      const result = await service.listPatterns({ phase: 2, page: 1, pageSize: 10 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(10);
    });

    it("getPattern maps the detail by content_id (id = content_id, examples with segments, relatedPatterns)", async () => {
      const detail = await service.getPattern("gr_0018");

      expect(detail.id).toBe("gr_0018");
      expect(detail.name).toContain("把");
      expect(detail.phase).toBe(4);
      expect(detail.examples.length).toBeGreaterThan(0);
      expect(detail.examples[0].id).toMatch(/^gr_0018_ex/);
      expect(Array.isArray(detail.examples[0].segments)).toBe(true);
      expect(
        detail.relatedPatterns.some(
          (r) => r.id === "gr_0019" && r.relationType === "CONTRASTS_WITH",
        ),
      ).toBe(true);
    });

    it("throws GrammarNotFoundError for a missing content_id (empty-result 404)", async () => {
      await expect(service.getPattern("gr_9999")).rejects.toBeInstanceOf(GrammarNotFoundError);
    });

    it("throws GrammarValidationError for invalid filters (maps to 400)", async () => {
      await expect(service.listPatterns({ phase: 5 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
      await expect(service.listPatterns({ hskLevel: 9 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
      await expect(service.listPatterns({ pageSize: 101 })).rejects.toBeInstanceOf(
        GrammarValidationError,
      );
    });

    it("is idempotent — repeated identical list calls return the same results", async () => {
      const a = await service.listPatterns({ phase: 2, page: 1, pageSize: 10 });
      const b = await service.listPatterns({ phase: 2, page: 1, pageSize: 10 });

      expect(b.total).toBe(a.total);
      expect(b.items).toEqual(a.items);
    });
  });
});
