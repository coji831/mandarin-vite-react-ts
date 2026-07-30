/**
 * @file apps/backend/src/modules/quiz/strategies/ImeSimulatorStrategy.js
 * IME Simulator quiz strategy.
 * Generates questions from radical content file HSK characters.
 * Evaluates character input via NFKC normalization (no tone required).
 */
import { readAggregateContent, shuffleArray } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ImeSimulatorStrategy");

export const imeSimulatorStrategy = {
  type: "ime-simulator",
  questionCount: 25,
  passThreshold: 0.8,
  timeLimitMinutes: 4,

  async generateQuestions(_userId?: string) {
    const radicalFiles = await readAggregateContent("radicals", "radicals.json");

    if (!radicalFiles || radicalFiles.length === 0) {
      throw new Error("Failed to load radical content files");
    }

    // Extract all unique HSK characters across all radical files
    const seenGlyphs = new Set<string>();
    const allCharacters: Array<{
      id: string;
      audioKey?: string;
      correctPinyin?: string;
      correctTone: number;
      category: string;
      displayPinyin?: string;
      character: string;
      meaning?: string;
    }> = [];

    for (const file of radicalFiles) {
      const hskChars = (file as Record<string, unknown>).hskCharacters as
        Array<{ glyph: string; pinyin?: string; meaning?: string }> | undefined;
      for (const char of hskChars || []) {
        const glyph = char.glyph;
        if (glyph && !seenGlyphs.has(glyph)) {
          seenGlyphs.add(glyph);
          allCharacters.push({
            id: `ime-q-${allCharacters.length}`,
            audioKey: char.pinyin || "",
            correctPinyin: char.pinyin || "",
            correctTone: 0,
            category: "ime",
            displayPinyin: char.pinyin || "",
            character: glyph,
            meaning: char.meaning || "",
          });
        }
      }
    }

    if (allCharacters.length === 0) {
      throw new Error("Failed to load HSK characters from radical files");
    }

    logger.info(`Generated ${allCharacters.length} unique HSK characters from radical files`);

    // Shuffle and return 25 randomized questions
    const shuffled = shuffleArray(allCharacters);
    return shuffled.slice(0, this.questionCount).map((q, index) => ({
      ...q,
      id: `ime-q-${index}`,
    }));
  },

  validateAnswer(
    question: { character: string; displayPinyin?: string; meaning?: string },
    { pinyin }: { pinyin: string },
  ) {
    const correct = pinyin.normalize("NFKC") === question.character.normalize("NFKC");
    const feedback = correct
      ? `Correct! "${question.character}" (${question.displayPinyin}) — ${question.meaning}`
      : `Incorrect. The correct character was "${question.character}" (${question.displayPinyin} — ${question.meaning}).`;

    return { correct, feedback };
  },
};
