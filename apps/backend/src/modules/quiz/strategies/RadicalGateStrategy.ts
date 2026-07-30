/**
 * @file apps/backend/src/modules/quiz/strategies/RadicalGateStrategy.js
 * Phase 2→3 Gate Quiz — Radical Gate strategy.
 *
 * Two tiers (20 questions total):
 *   Tier 1 — Core Component Lockdown (10 Qs): Match radical glyph ↔ meaning.
 *   Tier 2 — The Radical Predictor (10 Qs): Unfamiliar character → predict
 *            meaning category from its radical.
 *
 * Pass threshold: 85% overall, plus Tier 1 must be 100%.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { readAggregateContent, shuffleArray } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("RadicalGateStrategy");

/** Shape of a radical item from the radicals.json aggregate (camelCase fields). */
interface RadicalFile {
  id?: string;
  glyph?: string;
  meaning?: string;
  namePinyin?: string;
  isRecommended?: boolean;
  [key: string]: unknown;
}

/**
 * Pick N random distinct items from an array, ensuring they differ from `exclude`.
 * @param arr
 * @param n
 * @param exclude - ID(s) to exclude
 */
function pickDistractors(arr: RadicalFile[], n: number, exclude: string | string[]) {
  const excluded = Array.isArray(exclude) ? exclude : [exclude];
  const pool = arr.filter((f) => f.id && !excluded.includes(f.id));
  return shuffleArray(pool).slice(0, n);
}

/**
 * Build a reverse map: character glyph → radical IDs that contain it.
 * Queries the CharacterRadical DB table (source of truth).
 * @returns Map of glyph → radical IDs
 */
async function buildReverseCharMap(): Promise<Map<string, string[]>> {
  const dbRecords = await prisma.characterRadical.findMany({
    include: { character: { select: { glyph: true } } },
  });
  const map = new Map<string, string[]>();
  for (const record of dbRecords) {
    const glyph = record.character?.glyph ?? record.characterGlyph;
    if (!map.has(glyph)) {
      map.set(glyph, []);
    }
    map.get(glyph)!.push(record.radicalId);
  }
  return map;
}

export const radicalGateStrategy = {
  type: "radical-gate",
  questionCount: 10,
  passThreshold: 0.85,
  tierRules: {
    "radical-core-lockdown": { passThreshold: 1.0 },
  },
  timeLimitMinutes: 8,

  async generateQuestions() {
    const radicalFiles = await readAggregateContent<RadicalFile>("radicals", "radicals.json");

    if (!radicalFiles || radicalFiles.length === 0) {
      throw new Error("Failed to load radical content files");
    }

    const questions = [];

    // ── Tier 1: Core Component Lockdown (10 Qs) ──────────────────────────
    // Show a radical glyph, pick its meaning from 4 options.
    // Focus on recommended radicals (the most important ones).
    const recommended = radicalFiles.filter((f) => f.isRecommended);
    const tier1Pool = recommended.length > 5 ? recommended : radicalFiles;

    // Ensure at least 5 unique radicals for Tier 1
    const tier1Radicals = shuffleArray(tier1Pool).slice(0, Math.min(5, tier1Pool.length));

    for (let i = 0; i < tier1Radicals.length; i++) {
      const radical = tier1Radicals[i];
      const distractors = pickDistractors(radicalFiles, 3, radical.id!).map((f) => ({
        glyph: f.glyph!,
        meaning: f.meaning!,
        id: f.id!,
      }));

      const correctOption = {
        glyph: radical.glyph!,
        meaning: radical.meaning!,
        id: radical.id!,
      };

      const options = shuffleArray([correctOption, ...distractors]);

      questions.push({
        id: `rad-gate-t1-${i}`,
        audioKey: radical.namePinyin || "",
        correctPinyin: radical.id!, // Correct option ID
        correctTone: 0,
        category: "radical-core-lockdown",
        character: radical.glyph!,
        meaning: radical.meaning!,
        displayPinyin: radical.namePinyin!,
        options,
      });
    }

    // ── Tier 2: The Radical Predictor (10 Qs) ────────────────────────────
    // Show an unfamiliar character → predict meaning category from its radical.
    // Build reverse map: character → radical IDs (from DB)
    const reverseMap = await buildReverseCharMap();

    // Collect all unique characters from CharacterRadical DB (source of truth)
    const dbCharRadicals = await prisma.characterRadical.findMany({
      include: {
        character: {
          include: {
            characterReadings: {
              where: { type: "primary" },
              take: 1,
            },
          },
        },
      },
    });

    const allCharEntries: Array<{
      glyph: string;
      pinyin?: string;
      meaning?: string;
      radicalId: string;
      radicalMeaning?: string;
    }> = [];
    for (const record of dbCharRadicals) {
      if (!record.character) continue;
      const radical = radicalFiles.find((f) => f.id === record.radicalId);
      allCharEntries.push({
        glyph: record.character.glyph,
        pinyin: record.character.characterReadings[0]?.pinyin ?? "",
        meaning: record.character.definition ?? "",
        radicalId: record.radicalId,
        radicalMeaning: radical?.meaning ?? "",
      });
    }

    // De-duplicate by glyph
    const seen = new Set();
    const uniqueChars = [];
    for (const entry of allCharEntries) {
      if (!seen.has(entry.glyph)) {
        seen.add(entry.glyph);
        uniqueChars.push(entry);
      }
    }

    // Pick characters that have exactly one associated radical (clear semantic link)
    // or pick from radicals that have unambiguous semantic meanings
    const tier2Pool = uniqueChars.filter((c) => (reverseMap.get(c.glyph) || []).length <= 2);

    const tier2Chars = shuffleArray(tier2Pool.length >= 5 ? tier2Pool : uniqueChars).slice(0, 5);

    for (let i = 0; i < tier2Chars.length; i++) {
      const entry = tier2Chars[i];
      // Get the radical(s) this character belongs to
      const charRadicalIds = reverseMap.get(entry.glyph) || [entry.radicalId];
      const primaryRadicalId = charRadicalIds[0];
      const primaryRadical = radicalFiles.find((f) => f.id === primaryRadicalId);
      const correctMeaning = primaryRadical?.meaning || entry.radicalMeaning;

      // Pick distractors: meanings of 3 other radicals
      const distractors = pickDistractors(radicalFiles, 3, primaryRadicalId).map((f) => ({
        glyph: f.glyph!,
        meaning: f.meaning!,
        id: f.id!,
      }));

      const correctOption = {
        glyph: primaryRadical?.glyph || "",
        meaning: correctMeaning,
        id: primaryRadicalId,
      };

      const options = shuffleArray([correctOption, ...distractors]);

      questions.push({
        id: `rad-gate-t2-${i}`,
        audioKey: entry.pinyin || "",
        correctPinyin: primaryRadicalId, // Correct option ID
        correctTone: 0,
        category: "radical-predictor",
        character: entry.glyph,
        meaning: entry.meaning || "",
        displayPinyin: entry.pinyin || "",
        options,
        // Clue text for the question prompt
        prompt: `You haven't learned this character yet. Based on its radical, which category does it belong to?`,
      });
    }

    logger.info(
      `Generated ${questions.length} radical gate questions (T1: ${tier1Radicals.length}, T2: ${tier2Chars.length})`,
    );

    return shuffleArray(questions);
  },

  validateAnswer(
    question: {
      correctPinyin: string;
      category: string;
      options?: Array<{ id: string; meaning: string }>;
      character?: string;
      displayPinyin?: string;
      meaning?: string;
    },
    { pinyin }: { pinyin: string },
  ) {
    // pinyin contains the selected option ID
    const selectedId = (pinyin ?? "").trim();
    const correctId = question.correctPinyin;
    const correct = selectedId === correctId;

    // Find correct option for feedback
    const correctOption = (question.options || []).find(
      (o: { id: string; meaning: string }) => o.id === correctId,
    );
    const correctMeaning = correctOption?.meaning ?? "?";

    if (question.category === "radical-core-lockdown") {
      const charGlyph = question.character || "?";
      const feedback = correct
        ? `Correct! "${charGlyph}" means "${correctMeaning}".`
        : `The radical "${charGlyph}" means "${correctMeaning}".`;
      return { correct, feedback };
    }

    // Radical predictor
    const charGlyph = question.character || "?";
    const charPinyin = question.displayPinyin || "?";
    const charMeaning = question.meaning || "?";
    const feedback = correct
      ? `Correct! "${charGlyph}" (${charPinyin}) belongs to the "${correctMeaning}" category. It means "${charMeaning}".`
      : `"${charGlyph}" (${charPinyin}) belongs to the "${correctMeaning}" category. It means "${charMeaning}".`;

    return { correct, feedback };
  },
};
