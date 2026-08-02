/**
 * @file apps/backend/tests/integration/radicals-service.test.ts
 * @description DB-backed integration tests for RadicalsService.
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 * When no DB is reachable the suite is skipped.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { RadicalsService } from "../../src/modules/radicals/services/RadicalsService.js";
import { RadicalsRepository } from "../../src/modules/radicals/repositories/RadicalsRepository.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("RadicalsService (integration, DB)", () => {
  let service: RadicalsService;

  beforeAll(() => {
    service = new RadicalsService(new RadicalsRepository());
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe("getAllRadicals", () => {
    it("returns the 20 curated radicals ordered by Kangxi index", async () => {
      const radicals = await service.getAllRadicals();

      expect(radicals.length).toBe(20);
      // Ordered by kangxiIndex asc — rad_0001 (一) is first
      expect(radicals[0].id).toBe("rad_0001");
      expect(radicals[0].glyph).toBe("一");
      expect(radicals[0].meaning).toBe("one");
      expect(radicals[0].namePinyin).toBe("yī");
      expect(radicals[0].isRecommended).toBe(true);

      // Frontend RadicalItem contract is preserved (camelCase fields)
      expect(radicals[0]).toMatchObject({
        alternateGlyphs: [],
        nameChinese: "一",
        strokeCount: 1,
        kangxiIndex: 1,
        etymology: expect.any(String),
        frequencyRank: 1,
      });
      expect(radicals[0]).toHaveProperty("hskCharacters");
      expect(radicals[0].hskCharacters).toEqual([]);
    });
  });

  describe("getRadicalById", () => {
    it("returns the radical for a known business-key ID", async () => {
      const radical = await service.getRadicalById("rad_0038");

      expect(radical).not.toBeNull();
      expect(radical!.id).toBe("rad_0038");
      expect(radical!.glyph).toBe("女");
      expect(radical!.meaning).toBe("woman");
      expect(radical!.namePinyin).toBe("nǚ");
    });

    it("returns null for an unknown ID", async () => {
      const radical = await service.getRadicalById("rad_9999");
      expect(radical).toBeNull();
    });
  });

  describe("getRadicalsByCharacter", () => {
    it("returns the radicals for a character with known mappings", async () => {
      // 好 is a phono-semantic character whose semantic radical is 女 (rad_0038)
      const radicals = await service.getRadicalsByCharacter("好");

      expect(radicals.length).toBeGreaterThan(0);
      expect(radicals[0].id).toBe("rad_0038");
      expect(radicals[0].glyph).toBe("女");
      expect(radicals[0].meaning).toBe("woman");
    });

    it("returns an empty array for a glyph with no radical mapping", async () => {
      const radicals = await service.getRadicalsByCharacter("a");
      expect(radicals).toEqual([]);
    });
  });
});
