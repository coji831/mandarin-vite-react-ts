/**
 * @file apps/backend/tests/integration/ime-simulator-strategy.test.ts
 * @description DB-backed SMOKE test for ImeSimulatorStrategy.
 *
 * Regression guard for the latent-bug fix: the strategy previously ALWAYS
 * threw "Failed to load HSK characters from radical content files" because
 * radicals.json never carried an `hskCharacters` field. It now derives the
 * HSK character pool from recommended radicals → CharacterRadical → Character
 * (all-in-DB).
 *
 * Requires a reachable, SEEDED test database (see helpers/db.ts). Run via:
 *   cd apps/backend && npm run test:integration
 */
import { describe, it, expect, afterAll } from "vitest";
import { imeSimulatorStrategy } from "../../src/modules/quiz/strategies/ImeSimulatorStrategy.js";
import { checkDatabase, disconnectDatabase } from "./helpers/db.js";

const db = await checkDatabase();

describe.skipIf(!db.available)("ImeSimulatorStrategy (integration smoke, DB)", () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  it("generates questions instead of throwing (latent-bug fix)", async () => {
    const questions = await imeSimulatorStrategy.generateQuestions();

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(imeSimulatorStrategy.questionCount);

    for (const q of questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("category");
      expect(q.category).toBe("ime");
      expect(q).toHaveProperty("character");
      expect(q.character.length).toBeGreaterThan(0);
      expect(q).toHaveProperty("correctPinyin");
      expect(q).toHaveProperty("correctTone");
      expect(q).toHaveProperty("displayPinyin");
    }
  });
});
