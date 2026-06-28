/**
 * @file apps/backend/src/modules/quiz/strategies/RadicalSplitterStrategy.js
 * Radical Splitter quiz strategy.
 * Generates multiple-choice questions: show an HSK character → user picks
 * which radical gives it its meaning (3 options: 1 correct + 2 distractors).
 *
 * This is a Phase 2 review variant (active recall, not a gate quiz).
 */
import { readContentFiles, shuffleArray } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("RadicalSplitterStrategy");

/**
 * Pick N random distinct items from an array.
 * @param {Array} arr
 * @param {number} n
 * @returns {Array}
 */
function pickRandom(arr, n) {
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, n);
}

export const radicalSplitterStrategy = {
  type: "radical-splitter",
  questionCount: 20,
  passThreshold: 0.7,
  timeLimitMinutes: 10,

  async generateQuestions() {
    const radicalFiles = await readContentFiles("radicals", "rad_");

    if (!radicalFiles || radicalFiles.length === 0) {
      throw new Error("Failed to load radical content files");
    }

    // Build a pool of candidate questions: for each radical with hsk_characters,
    // create a question showing one of its characters
    const candidates = [];

    for (const file of radicalFiles) {
      const hskChars = file.metadata?.hsk_characters || [];
      if (hskChars.length === 0) continue;

      for (const char of hskChars) {
        candidates.push({
          radicalId: file.id,
          radicalGlyph: file.glyph,
          radicalMeaning: file.meaning,
          characterGlyph: char.glyph,
          characterPinyin: char.pinyin,
          characterMeaning: char.meaning,
        });
      }
    }

    if (candidates.length === 0) {
      throw new Error("No candidate questions generated — radical files lack hsk_characters");
    }

    logger.info(`Generated ${candidates.length} candidate questions from radical files`);

    // Shuffle and pick questionCount candidates
    const selected = shuffleArray(candidates).slice(0, this.questionCount);

    // Build questions with 3 options: 1 correct radical + 2 distractors
    const questions = selected.map((c, index) => {
      // Get distractor radicals (different from the correct one)
      const distractors = radicalFiles
        .filter((f) => f.id !== c.radicalId)
        .map((f) => ({
          glyph: f.glyph,
          meaning: f.meaning,
          id: f.id,
        }));

      const distractorOptions = pickRandom(distractors, 2);

      // Build 3 options, shuffled
      const correctOption = {
        glyph: c.radicalGlyph,
        meaning: c.radicalMeaning,
        id: c.radicalId,
      };

      const options = shuffleArray([correctOption, ...distractorOptions]);

      return {
        id: `rad-split-${index}`,
        audioKey: c.characterPinyin,
        correctPinyin: c.radicalId, // Stores the correct option ID for comparison
        correctTone: 0,
        category: "radical-splitter",
        character: c.characterGlyph,
        meaning: c.characterMeaning,
        displayPinyin: c.characterPinyin,
        options,
      };
    });

    return questions;
  },

  validateAnswer(question, { pinyin }) {
    // pinyin contains the selected option ID
    const selectedId = (pinyin ?? "").trim();
    const correctId = question.correctPinyin;
    const correct = selectedId === correctId;

    // Find the correct option for feedback
    const correctOption = (question.options || []).find((o) => o.id === correctId);
    const correctGlyph = correctOption?.glyph ?? "?";
    const correctMeaning = correctOption?.meaning ?? "?";

    const feedback = correct
      ? `Correct! "${question.character}" (${question.displayPinyin}) uses the radical ${correctGlyph} (${correctMeaning}).`
      : `Not quite. "${question.character}" (${question.displayPinyin}) uses the radical ${correctGlyph} (${correctMeaning}) to give it meaning.`;

    return { correct, feedback };
  },
};
