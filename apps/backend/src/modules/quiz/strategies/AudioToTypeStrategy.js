/**
 * @file apps/backend/src/modules/quiz/strategies/AudioToTypeStrategy.js
 * Audio-to-Type quiz strategy for Phase 1 Gate.
 * Generates questions and validates answers for pinyin + tone recognition.
 *
 * Data source: PinyinCombination (Prisma junction table) — seeded from the
 * old pinyin-tones-pool + phase1-entries. No longer reads static JSON files.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { stripToneMarks, shuffleArray } from "../../../shared/utils/contentUtils.js";

export const audioToTypeStrategy = {
  type: "audio-to-type",
  questionCount: 10,
  passThreshold: 0.9,
  timeLimitMinutes: 2.5,

  /**
   * @param {string} userId
   * @returns {Promise<Array<{id: string, audioKey: string, correctPinyin: string, correctTone: number, category: string, character: string|null}>>}
   */
  async generateQuestions(userId) {
    // Read all PinyinCombination records from the junction table
    const combinations = await prisma.pinyinCombination.findMany({
      select: {
        syllable: true,
        tone: true,
        character: true,
      },
    });

    if (combinations.length === 0) {
      throw new Error("PinyinCombination table is empty — run the seed script first");
    }

    // Build a lookup map from syllable → Chinese character
    const charBySyllable = new Map();
    for (const combo of combinations) {
      if (combo.character && !charBySyllable.has(combo.syllable)) {
        charBySyllable.set(combo.syllable, combo.character);
      }
    }

    // Shuffle and format as question objects
    const shuffled = shuffleArray(combinations);
    return shuffled.map((entry, index) => ({
      id: `q-${index + 1}`,
      audioKey: entry.syllable,
      correctPinyin: stripToneMarks(entry.syllable),
      correctTone: entry.tone,
      category: entry.tone === 0 ? "tones" : Math.random() > 0.5 ? "pinyin" : "tones",
      displayPinyin: entry.syllable,
      character: charBySyllable.get(entry.syllable) || null,
    }));
  },

  /**
   * @param {object} question
   * @param {string} question.correctPinyin
   * @param {number} question.correctTone
   * @param {string} answer.pinyin
   * @param {number} answer.tone
   * @returns {{correct: boolean, feedback: string}}
   */
  validateAnswer(question, { pinyin, tone }) {
    const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
    const toneCorrect = tone === question.correctTone;
    const correct = pinyinCorrect && toneCorrect;
    let feedback;
    if (correct) {
      feedback = `Correct! "${question.displayPinyin || question.correctPinyin}".`;
    } else if (!pinyinCorrect && !toneCorrect) {
      feedback = `Both pinyin and tone were incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    } else if (!pinyinCorrect) {
      feedback = `Pinyin was incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    } else {
      feedback = `Tone was incorrect. The audio was "${question.displayPinyin || question.correctPinyin}".`;
    }
    return { correct, feedback };
  },
};
