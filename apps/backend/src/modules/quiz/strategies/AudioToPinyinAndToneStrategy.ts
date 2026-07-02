/**
 * @file apps/backend/src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.js
 * Combined Audio-to-Pinyin-and-Tone quiz strategy.
 * Generates questions from PinyinCombination and evaluates BOTH pinyin and tone.
 *
 * Data source: PinyinCombination (Prisma junction table)
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { stripToneMarks, shuffleArray } from "../../../shared/utils/contentUtils.js";

export const audioToPinyinAndToneStrategy = {
  type: "audio-to-pinyin-tone",
  questionCount: 10,
  passThreshold: 0.85,
  timeLimitMinutes: 2.5,

  async generateQuestions(userId: any) {
    const combinations = await prisma.pinyinCombination.findMany({
      select: {
        syllable: true,
        tone: true,
        character: true,
        meaning: true,
      },
    });

    if (combinations.length === 0) {
      throw new Error("PinyinCombination table is empty — run the seed script first");
    }

    const charBySyllable = new Map();
    for (const combo of combinations) {
      if (combo.character && !charBySyllable.has(combo.syllable)) {
        charBySyllable.set(combo.syllable, combo.character);
      }
    }

    const shuffled = shuffleArray([...combinations]);
    return shuffled.map((entry, index) => ({
      id: `q-${index + 1}`,
      audioKey: entry.syllable,
      correctPinyin: stripToneMarks(entry.syllable),
      correctTone: entry.tone,
      category: entry.tone === 0 ? "tones" : Math.random() > 0.5 ? "pinyin" : "tones",
      displayPinyin: entry.syllable,
      character: charBySyllable.get(entry.syllable) || null,
      meaning: entry.meaning || null,
    }));
  },

  validateAnswer(question: any, { pinyin, tone }: any) {
    const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
    const toneCorrect = tone === question.correctTone;
    const correct = pinyinCorrect && toneCorrect;
    let feedback;
    if (correct) {
      feedback = `Correct! "${question.displayPinyin || question.correctPinyin}" — perfect pinyin and tone.`;
    } else {
      const parts = [];
      if (!pinyinCorrect) parts.push("pinyin");
      if (!toneCorrect) parts.push("tone");
      feedback = `The correct answer was "${question.displayPinyin || question.correctPinyin}". ${parts.join(" and ")} ${parts.length > 1 ? "were" : "was"} incorrect.`;
    }
    return { correct, feedback };
  },
};
