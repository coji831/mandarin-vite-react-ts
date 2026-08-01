/**
 * @file apps/backend/tests/integration/review-service.test.ts
 * @description DB-backed integration tests for ReviewService item building.
 *
 * Verifies tone items are built from the Tone table (camelCase fields) and
 * radical items from the Radical table — the all-in-DB rewrite of the former
 * content/*.json reads.
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ReviewService } from "../../src/modules/review/services/ReviewService.js";
import { ReviewRepository } from "../../src/modules/review/repositories/ReviewRepository.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("ReviewService (integration, DB)", () => {
  let service: ReviewService;

  // A user id that has no SRS state → all items are treated as new/due.
  const TEST_USER = "integration-test-review-user";

  beforeAll(() => {
    service = new ReviewService(new ReviewRepository());
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("tone items", () => {
    it("builds 5 tone-syllable items from the Tone table", async () => {
      const items = await service.getReviewItems(TEST_USER, {
        source: "all",
        type: "tone",
        limit: 50,
      });

      const toneItems = items.filter((i) => i.itemType === "tone-syllable");
      expect(toneItems.length).toBe(5);
    });

    it("maps tone rows to camelCase front/back/meaning fields", async () => {
      const items = await service.getReviewItems(TEST_USER, {
        source: "all",
        type: "tone",
        limit: 50,
      });

      const toneItems = items.filter((i) => i.itemType === "tone-syllable");
      // tone 1: mark "ˉ", name "First Tone", exampleSyllable "mā",
      // pitchDescription "High level", exampleCharacter "妈"
      const tone1 = toneItems.find((i) => i.itemId === "1");
      expect(tone1).toBeDefined();
      expect(tone1!.front).toBe("ˉ First Tone");
      expect(tone1!.back).toContain("mā");
      expect(tone1!.back).toContain("High level");
      expect(tone1!.back).toContain("妈");
      expect(tone1!.category).toBe("tones");
      expect(tone1!.character).toBe("妈");
      expect(tone1!.meaning).toBe("High level");
      expect(tone1!.pinyinPlain).toBe("ma"); // stripToneMarks("mā")
      expect(tone1!.correctTone).toBe(1);
    });
  });

  describe("radical items", () => {
    it("builds 20 radical items from the Radical table", async () => {
      const items = await service.getReviewItems(TEST_USER, {
        source: "all",
        type: "radical",
        limit: 50,
      });

      const radicalItems = items.filter((i) => i.itemType === "radical");
      expect(radicalItems.length).toBe(20);
    });

    it("maps radical rows to the review item shape with options", async () => {
      const items = await service.getReviewItems(TEST_USER, {
        source: "all",
        type: "radical",
        limit: 50,
      });

      const radicalItems = items.filter((i) => i.itemType === "radical");
      const rad = radicalItems.find((i) => i.itemId === "rad_0001");
      expect(rad).toBeDefined();
      expect(rad!.front).toBe("yī");
      expect(rad!.character).toBe("一");
      expect(rad!.meaning).toBe("one");
      expect(rad!.category).toBe("radicals");
      expect(rad!.options).toBeDefined();
      expect(rad!.options!.length).toBeGreaterThan(0);
      expect(rad!.options![0]).toMatchObject({ id: expect.any(String) });
    });
  });
});
