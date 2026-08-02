/**
 * @file apps/backend/src/modules/quiz/strategies/ImeSimulatorStrategy.js
 * IME Simulator quiz strategy.
 * Generates questions from radical HSK characters.
 * Evaluates character input via NFKC normalization (no tone required).
 *
 * FIXES (latent bug): radicals.json never carried an `hskCharacters` field, so
 * the old strategy always threw "Failed to load HSK characters from radical
 * files". HSK characters are now derived from the DB — recommended radicals
 * joined to their CharacterRadical → Character rows (all-in-DB).
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { shuffleArray } from "../../../shared/utils/contentUtils.js";
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ImeSimulatorStrategy");

export const imeSimulatorStrategy = {
  type: "ime-simulator",
  questionCount: 25,
  passThreshold: 0.8,
  timeLimitMinutes: 4,

  async generateQuestions(_userId?: string) {
    // Derive the HSK character pool from recommended radicals → CharacterRadical
    // → Character (the CharacterRadical junction is the source of truth for
    // which characters each radical explains).
    const recommendedRadicals = await prisma.radical.findMany({
      where: { isRecommended: true },
      include: {
        characterRadicals: {
          include: {
            character: {
              select: {
                glyph: true,
                definition: true,
                readings: true,
                hskLevel: true,
                frequencyRank: true,
              },
            },
          },
        },
      },
    });

    if (!recommendedRadicals || recommendedRadicals.length === 0) {
      throw new Error("Failed to load radical content files");
    }

    // Extract unique characters across all recommended radicals.
    // G4: only keep characters that HAVE a real meaning clue — a `meaning: ""`
    // clue made IME questions unanswerable via the UI (obscure characters like
    // 圾/偾/婿 carry no usable definition).
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
      hskLevel?: number;
      frequencyRank?: number;
    }> = [];

    for (const radical of recommendedRadicals) {
      for (const cr of radical.characterRadicals) {
        const ch = cr.character;
        if (!ch || !ch.glyph || seenGlyphs.has(ch.glyph)) continue;

        const meaning = ch.definition?.trim() || "";
        if (!meaning) continue; // G4: never emit an empty meaning clue

        seenGlyphs.add(ch.glyph);

        const readings = Array.isArray(ch.readings)
          ? (ch.readings as Array<{ pinyin?: string }>)
          : [];
        const pinyin = readings[0]?.pinyin || "";

        allCharacters.push({
          id: `ime-q-${allCharacters.length}`,
          audioKey: pinyin,
          // G3: the user's IME input IS the character glyph — the generic
          // `QuizService.submitAnswer` compares input against `correctPinyin`,
          // so it must hold the glyph (same convention as RadicalGateStrategy's
          // "correct option ID"). `displayPinyin` keeps the pinyin for display.
          correctPinyin: ch.glyph,
          correctTone: 0,
          category: "ime",
          displayPinyin: pinyin,
          character: ch.glyph,
          meaning,
          hskLevel: ch.hskLevel ?? undefined,
          frequencyRank: ch.frequencyRank ?? undefined,
        });
      }
    }

    if (allCharacters.length === 0) {
      throw new Error("Failed to load HSK characters from radical content files");
    }

    // G4: prefer familiar/common characters — HSK 1–3 first (lower hskLevel),
    // then lower frequencyRank (more frequent). Select the most familiar pool
    // of `questionCount` before shuffling for delivery order.
    allCharacters.sort((a, b) => {
      const hskA = a.hskLevel ?? 99;
      const hskB = b.hskLevel ?? 99;
      if (hskA !== hskB) return hskA - hskB;
      const freqA = a.frequencyRank ?? Number.MAX_SAFE_INTEGER;
      const freqB = b.frequencyRank ?? Number.MAX_SAFE_INTEGER;
      return freqA - freqB;
    });

    logger.info(
      `Generated ${allCharacters.length} unique HSK characters with meaning clues (familiar pool: ${Math.min(this.questionCount, allCharacters.length)})`,
    );

    // Shuffle only the selected familiar pool, then return the questions.
    const pool = allCharacters.slice(0, this.questionCount);
    const shuffled = shuffleArray(pool);
    return shuffled.map((q, index) => ({
      id: `ime-q-${index}`,
      audioKey: q.audioKey,
      correctPinyin: q.correctPinyin,
      correctTone: q.correctTone,
      category: q.category,
      displayPinyin: q.displayPinyin,
      character: q.character,
      meaning: q.meaning,
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
