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
import { readContentFiles, shuffleArray } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("RadicalGateStrategy");

/**
 * Pick N random distinct items from an array, ensuring they differ from `exclude`.
 * @param {Array} arr
 * @param {number} n
 * @param {string|string[]} exclude - ID(s) to exclude
 * @returns {Array}
 */
function pickDistractors(arr, n, exclude) {
  const excluded = Array.isArray(exclude) ? exclude : [exclude];
  const pool = arr.filter((f) => !excluded.includes(f.id));
  return shuffleArray(pool).slice(0, n);
}

/**
 * Build a reverse map: character glyph → radical IDs that contain it.
 * @param {Array} radicalFiles
 * @returns {Map<string, string[]>}
 */
function buildReverseCharMap(radicalFiles) {
  const map = new Map();
  for (const file of radicalFiles) {
    const hskChars = file.metadata?.hsk_characters || [];
    for (const char of hskChars) {
      if (!map.has(char.glyph)) {
        map.set(char.glyph, []);
      }
      map.get(char.glyph).push(file.id);
    }
  }
  return map;
}

export const radicalGateStrategy = {
  type: "radical-gate",
  questionCount: 20,
  passThreshold: 0.85,
  timeLimitMinutes: 15,

  async generateQuestions() {
    const radicalFiles = await readContentFiles("radicals", "rad_");

    if (!radicalFiles || radicalFiles.length === 0) {
      throw new Error("Failed to load radical content files");
    }

    const questions = [];

    // ── Tier 1: Core Component Lockdown (10 Qs) ──────────────────────────
    // Show a radical glyph, pick its meaning from 4 options.
    // Focus on recommended radicals (the most important ones).
    const recommended = radicalFiles.filter((f) => f.is_recommended);
    const tier1Pool = recommended.length > 5 ? recommended : radicalFiles;

    // Ensure at least 10 unique radicals for Tier 1
    const tier1Radicals = shuffleArray(tier1Pool).slice(0, Math.min(10, tier1Pool.length));

    for (let i = 0; i < tier1Radicals.length; i++) {
      const radical = tier1Radicals[i];
      const distractors = pickDistractors(radicalFiles, 3, radical.id).map((f) => ({
        glyph: f.glyph,
        meaning: f.meaning,
        id: f.id,
      }));

      const correctOption = {
        glyph: radical.glyph,
        meaning: radical.meaning,
        id: radical.id,
      };

      const options = shuffleArray([correctOption, ...distractors]);

      questions.push({
        id: `rad-gate-t1-${i}`,
        audioKey: radical.name_pinyin || "",
        correctPinyin: radical.id, // Correct option ID
        correctTone: 0,
        category: "radical-core-lockdown",
        character: radical.glyph,
        meaning: radical.meaning,
        displayPinyin: radical.name_pinyin,
        options,
      });
    }

    // ── Tier 2: The Radical Predictor (10 Qs) ────────────────────────────
    // Show an unfamiliar character → predict meaning category from its radical.
    // Build reverse map: character → radical IDs
    const reverseMap = buildReverseCharMap(radicalFiles);

    // Collect all unique characters that appear in hsk_characters
    const allCharEntries = [];
    for (const file of radicalFiles) {
      const hskChars = file.metadata?.hsk_characters || [];
      for (const char of hskChars) {
        if (char.glyph) {
          allCharEntries.push({
            glyph: char.glyph,
            pinyin: char.pinyin,
            meaning: char.meaning,
            radicalId: file.id,
            radicalMeaning: file.meaning,
          });
        }
      }
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

    const tier2Chars = shuffleArray(tier2Pool.length >= 10 ? tier2Pool : uniqueChars).slice(0, 10);

    for (let i = 0; i < tier2Chars.length; i++) {
      const entry = tier2Chars[i];
      // Get the radical(s) this character belongs to
      const charRadicalIds = reverseMap.get(entry.glyph) || [entry.radicalId];
      const primaryRadicalId = charRadicalIds[0];
      const primaryRadical = radicalFiles.find((f) => f.id === primaryRadicalId);
      const correctMeaning = primaryRadical?.meaning || entry.radicalMeaning;

      // Pick distractors: meanings of 3 other radicals
      const distractors = pickDistractors(radicalFiles, 3, primaryRadicalId).map((f) => ({
        glyph: f.glyph,
        meaning: f.meaning,
        id: f.id,
      }));

      const correctOption = {
        glyph: primaryRadical?.glyph || "",
        meaning: correctMeaning,
        id: primaryRadicalId,
      };

      const options = shuffleArray([correctOption, ...distractors]);

      questions.push({
        id: `rad-gate-t2-${i}`,
        audioKey: entry.pinyin,
        correctPinyin: primaryRadicalId, // Correct option ID
        correctTone: 0,
        category: "radical-predictor",
        character: entry.glyph,
        meaning: entry.meaning,
        displayPinyin: entry.pinyin,
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

  validateAnswer(question, { pinyin }) {
    // pinyin contains the selected option ID
    const selectedId = (pinyin ?? "").trim();
    const correctId = question.correctPinyin;
    const correct = selectedId === correctId;

    // Find correct option for feedback
    const correctOption = (question.options || []).find((o) => o.id === correctId);
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
