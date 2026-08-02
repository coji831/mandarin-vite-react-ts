/**
 * @file apps/backend/src/modules/quiz/strategies/QualificationQuizStrategy.ts
 * @description Basic HSK-level-appropriate quiz strategy for fallback when no
 * passage exists for the comprehension gate. Generates character-recognition
 * questions ("What is the pinyin for [character]?") using Character data
 * filtered by HSK level.
 *
 * Story 21.9: Phase Gate Calibration
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import { shuffleArray } from "../../../shared/utils/contentUtils.js";
import { GATE_THRESHOLDS } from "../../../config/gate-thresholds.js";

// ── Types ───────────────────────────────────────────────────────────────────

export interface QualificationQuestion {
  id: string;
  type: "character-recognition";
  question: string;
  character: string;
  correctPinyin: string;
  correctTone: number;
  choices: string[];
  correctIndex: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a CharacterReading JSON array to find the primary reading.
 */
interface CharacterReadingEntry {
  pinyin: string;
  tone: number;
  type?: string;
  meaning?: string;
}

function getPrimaryReading(readingsJson: unknown): { pinyin: string; tone: number } | null {
  if (!Array.isArray(readingsJson) || readingsJson.length === 0) return null;
  const readings = readingsJson as CharacterReadingEntry[];

  // Prefer primary type
  const primary = readings.find((r) => r.type === "primary");
  if (primary) return { pinyin: primary.pinyin, tone: primary.tone };

  // Fallback to first reading
  return { pinyin: readings[0].pinyin, tone: readings[0].tone };
}

/**
 * Get the tone number mark for display in choices.
 */
function _getToneMark(tone: number): string {
  const marks = ["", "ˉ", "ˊ", "ˇ", "ˋ"];
  return marks[tone] ?? "";
}

// ── Strategy ────────────────────────────────────────────────────────────────

/**
 * QualificationQuizStrategy
 * Generates basic character-recognition multiple-choice questions at the
 * learner's HSK level. Used as fallback when no passage is available for the
 * comprehension gate.
 */
export const qualificationQuizStrategy = {
  type: "qualification",
  questionCount: GATE_THRESHOLDS.QUALIFICATION_QUIZ_QUESTION_COUNT,
  passThreshold: GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE,
  timeLimitMinutes: 5,

  /**
   * Generate qualification quiz questions for a given HSK level.
   * @param userId - Unused; kept for interface compatibility
   * @param hskLevel - Optional HSK level to filter characters by
   */
  async generateQuestions(userId?: string, hskLevel?: number): Promise<QualificationQuestion[]> {
    // Validate hskLevel
    const level = hskLevel && hskLevel >= 1 && hskLevel <= 6 ? hskLevel : 1;

    // Fetch characters at the given HSK level
    // Use raw JSON filter to skip characters with empty readings array
    const characters = await prisma.character.findMany({
      where: {
        hskLevel: level,
        NOT: { readings: { equals: "[]" } },
      },
      take: 50,
    });

    if (characters.length < GATE_THRESHOLDS.QUALIFICATION_QUIZ_QUESTION_COUNT) {
      // Fallback: try broader search without reading filter
      const fallbackChars = await prisma.character.findMany({
        where: { hskLevel: level },
        take: 50,
      });
      if (fallbackChars.length < GATE_THRESHOLDS.QUALIFICATION_QUIZ_QUESTION_COUNT) {
        // Last resort: any characters
        const anyChars = await prisma.character.findMany({ take: 50 });
        if (anyChars.length === 0) {
          throw new Error("No characters found in the database for qualification quiz");
        }
        return buildQuestions(anyChars, level);
      }
      return buildQuestions(fallbackChars, level);
    }

    return buildQuestions(characters, level);
  },
};

/**
 * Build qualification questions from character data.
 */
function buildQuestions(
  characters: Array<{ id: string; glyph: string; readings: unknown }>,
  _hskLevel: number,
): QualificationQuestion[] {
  const selected = shuffleArray(characters).slice(
    0,
    GATE_THRESHOLDS.QUALIFICATION_QUIZ_QUESTION_COUNT,
  );

  return selected.map((char, index) => {
    const reading = getPrimaryReading(char.readings);
    const correctPinyin = reading?.pinyin ?? "";
    const correctTone = reading?.tone ?? 0;

    // Generate 4 multiple-choice pinyin options
    const choices = generatePinyinChoices(correctPinyin, selected);

    return {
      id: `qual-q-${index}`,
      type: "character-recognition",
      question: `What is the pinyin for "${char.glyph}"?`,
      character: char.glyph,
      correctPinyin,
      correctTone,
      choices,
      correctIndex: choices.indexOf(correctPinyin),
    };
  });
}

/**
 * Generate pinyin choices including the correct answer and 3 distractors.
 */
function generatePinyinChoices(
  correctPinyin: string,
  allCharacters: Array<{ readings: unknown }>,
): string[] {
  // Collect all unique pinyins from the character pool
  const allPinyins = new Set<string>();
  for (const char of allCharacters) {
    const reading = getPrimaryReading(char.readings);
    if (reading?.pinyin) {
      allPinyins.add(reading.pinyin);
    }
  }

  // Remove correct answer from pool
  allPinyins.delete(correctPinyin);

  // Pick 3 distractors
  const distractorPool = Array.from(allPinyins).filter((p) => p !== correctPinyin);
  const distractors = shuffleArray(distractorPool).slice(0, 3);

  // If not enough distractors, fill with generic ones
  while (distractors.length < 3) {
    const generic = GENERIC_DISTRACTORS[distractors.length] ?? `pinyin-${distractors.length}`;
    if (generic !== correctPinyin && !distractors.includes(generic)) {
      distractors.push(generic);
    }
  }

  const choices = shuffleArray([correctPinyin, ...distractors]);
  return choices;
}

// Fallback generic pinyin distractors if character pool is too small
const GENERIC_DISTRACTORS = ["bù", "hǎo", "shì", "le", "wǒ", "nǐ", "tā", "de", "yǒu", "rén"];
