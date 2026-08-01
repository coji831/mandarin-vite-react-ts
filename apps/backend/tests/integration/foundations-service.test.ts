/**
 * @file apps/backend/tests/integration/foundations-service.test.ts
 * @description DB-backed integration tests for FoundationsService.getPinyinTonesPool.
 *
 * Verifies the all-in-DB pool build: PinyinPhoneme (initials/finals) + Tone +
 * TonePair + ToneRule reference tables + PinyinSyllable combos.
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FoundationsService } from "../../src/modules/foundations/services/FoundationsService.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("FoundationsService.getPinyinTonesPool (integration, DB)", () => {
  let service: FoundationsService;

  beforeAll(() => {
    service = new FoundationsService();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("builds the pool from the reference tables (all-in-DB)", async () => {
    const pool = await service.getPinyinTonesPool();

    // PinyinPhoneme: 18 initials + 32 finals
    expect(pool.initials.length).toBe(18);
    expect(pool.finals.length).toBe(32);
    // Tone: 5 rows (tn_0..tn_4)
    expect(pool.toneInfo.length).toBe(5);
    // TonePair: 6 rows, ToneRule: 3 rows (from tone-reference.json)
    expect(pool.tonePairs.length).toBe(6);
    expect(pool.toneRules.length).toBe(3);
    // PinyinSyllable: 2045 rows → grouped into unique init×fin pairs
    expect(pool.combinations.length).toBeGreaterThan(0);
  });

  it("maps tone rows to the frontend camelCase shape", async () => {
    const pool = await service.getPinyinTonesPool();

    const tone1 = pool.toneInfo.find((t) => t.number === 1);
    expect(tone1).toBeDefined();
    expect(tone1!.name).toBe("First Tone");
    expect(tone1!.mark).toBe("ˉ");
    expect(tone1!.pinyinExample.length).toBeGreaterThan(0); // exampleSyllable
    expect(tone1!.chineseExample.length).toBeGreaterThan(0); // exampleCharacter
    expect(Array.isArray(tone1!.contour)).toBe(true); // number[] pitch contour

    const neutral = pool.toneInfo.find((t) => t.number === 0);
    expect(neutral).toBeDefined();
    expect(neutral!.name).toBe("Neutral");
  });

  it("maps initials/finals with IPA + pronunciation guides", async () => {
    const pool = await service.getPinyinTonesPool();

    const initB = pool.initials.find((i) => i.pinyin === "b");
    expect(initB).toBeDefined();
    expect(initB!.ipa).toBe("/p/");
    expect(initB!.description.length).toBeGreaterThan(0);

    const finA = pool.finals.find((f) => f.pinyin === "a");
    expect(finA).toBeDefined();
    expect(["simple", "compound"]).toContain(finA!.type);
  });
});
