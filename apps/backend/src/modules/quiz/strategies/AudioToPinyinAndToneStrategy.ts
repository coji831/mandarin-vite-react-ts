/**
 * @file apps/backend/src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.js
 * Combined Audio-to-Pinyin-and-Tone quiz strategy.
 * Generates questions from PinyinSyllable + PinyinCharacterMapping and evaluates BOTH pinyin and tone.
 *
 * Data source: PinyinSyllable (replaces deprecated PinyinCombination)
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { stripToneMarks, shuffleArray } from "../../../shared/utils/contentUtils.js";

export const audioToPinyinAndToneStrategy = {
  type: "audio-to-pinyin-tone",
  questionCount: 10,
  passThreshold: 0.85,
  timeLimitMinutes: 2.5,

  async generateQuestions(_userId?: string) {
    const syllables = await prisma.pinyinSyllable.findMany({
      select: {
        syllablePretty: true,
        syllable: true,
        tone: true,
      },
    });

    if (syllables.length === 0) {
      throw new Error("PinyinSyllable table is empty — run the seed script first");
    }

    // Get character mappings for syllables that have them
    const mappings = await prisma.pinyinCharacterMapping.findMany({
      select: {
        pinyinSyllable: { select: { syllablePretty: true, syllable: true } },
        character: { select: { glyph: true } },
      },
      where: { isDefault: true },
    });

    const charBySyllable = new Map<string, string>();
    for (const m of mappings) {
      const syl = m.pinyinSyllable.syllablePretty;
      if (!charBySyllable.has(syl)) {
        charBySyllable.set(syl, m.character.glyph);
      }
    }

    const shuffled = shuffleArray([...syllables]);
    return shuffled.map((entry, index) => ({
      id: `q-${index + 1}`,
      audioKey: entry.syllable,
      correctPinyin: stripToneMarks(entry.syllable),
      correctTone: entry.tone,
      category: entry.tone === 0 ? "tones" : Math.random() > 0.5 ? "pinyin" : "tones",
      displayPinyin: entry.syllablePretty,
      character: charBySyllable.get(entry.syllablePretty) || null,
      meaning: null,
    }));
  },

  validateAnswer(
    question: { correctPinyin: string; correctTone: number; displayPinyin?: string },
    { pinyin, tone }: { pinyin: string; tone: number },
  ) {
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
