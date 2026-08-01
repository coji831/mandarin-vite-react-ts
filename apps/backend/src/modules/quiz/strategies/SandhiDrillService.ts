/**
 * @file apps/backend/src/modules/quiz/strategies/SandhiDrillService.ts
 * @description Tone Sandhi Drill question generator.
 *
 * NOT a registered quiz strategy — follows the Drill Widget pattern,
 * not the full QuizStrategy interface. Generates sandhi drill questions
 * from the Word + CharacterReading database tables.
 *
 * Story 21.17: Tone Sandhi Practice Quiz
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import { shuffleArray } from "../../../shared/utils/contentUtils.js";
import { applyToneMark } from "@mandarin/shared-utils";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DrillQuestion {
  id: string;
  characters: string;
  dictionaryPinyin: string;
  correctAnswer: string;
  ruleId: "3-3-sandhi" | "bu-before-4th" | "yi-before-4th" | "yi-before-non4th";
  options: string[];
}

interface WordCandidate {
  wordId: string;
  simplified: string;
  dictionaryPinyin: string;
  char1Glyph: string;
  char2Glyph: string;
  pinyin1Plain: string;
  pinyin2Plain: string;
  tone1: number;
  tone2: number;
}

type SandhiRuleId = DrillQuestion["ruleId"];

// ── Rule definitions ────────────────────────────────────────────────────────

interface RuleDef {
  id: SandhiRuleId;
  match: (c: WordCandidate) => boolean;
  sandhiForm: (c: WordCandidate) => { pinyin1: string; pinyin2: string };
}

const RULES: RuleDef[] = [
  {
    id: "3-3-sandhi",
    match: (c) => c.tone1 === 3 && c.tone2 === 3,
    sandhiForm: (c) => ({
      pinyin1: applyToneMark(c.pinyin1Plain, 2),
      pinyin2: applyToneMark(c.pinyin2Plain, 3),
    }),
  },
  {
    id: "bu-before-4th",
    match: (c) => c.char1Glyph === "不" && c.tone2 === 4,
    sandhiForm: (c) => ({
      pinyin1: applyToneMark(c.pinyin1Plain, 2),
      pinyin2: applyToneMark(c.pinyin2Plain, 4),
    }),
  },
  {
    id: "yi-before-4th",
    match: (c) => c.char1Glyph === "一" && c.tone2 === 4,
    sandhiForm: (c) => ({
      pinyin1: applyToneMark(c.pinyin1Plain, 2),
      pinyin2: applyToneMark(c.pinyin2Plain, 4),
    }),
  },
  {
    id: "yi-before-non4th",
    match: (c) => c.char1Glyph === "一" && c.tone2 >= 1 && c.tone2 <= 3,
    sandhiForm: (c) => ({
      pinyin1: applyToneMark(c.pinyin1Plain, 4),
      pinyin2: applyToneMark(c.pinyin2Plain, c.tone2),
    }),
  },
];

// ── Service ─────────────────────────────────────────────────────────────────

export class SandhiDrillService {
  /**
   * Generate sandhi drill questions.
   * Queries the database for 2-character words matching sandhi patterns,
   * generates questions with multiple-choice pinyin options.
   *
   * @param count - Number of questions to generate (clamped 5-25)
   * @returns Array of DrillQuestion objects
   */
  async generateQuestions(count: number = 10): Promise<DrillQuestion[]> {
    const clamped = Math.max(5, Math.min(25, count));

    const candidates = await this.loadCandidates();
    if (candidates.length === 0) {
      throw new Error("Failed to load sandhi drill candidates");
    }

    // Classify candidates by rule
    const byRule = new Map<SandhiRuleId, WordCandidate[]>();
    for (const rule of RULES) {
      byRule.set(rule.id, candidates.filter(rule.match));
    }

    // Calculate proportional distribution across rules
    const questions = this.distributeQuestions(clamped, byRule);
    return questions;
  }

  /**
   * Score a sandhi drill answer.
   *
   * @param question - The DrillQuestion that was asked
   * @param selectedAnswer - The pinyin answer the user chose
   * @returns Object with correct flag and feedback
   */
  scoreAnswer(
    question: DrillQuestion,
    selectedAnswer: string,
  ): { correct: boolean; feedback: string } {
    const correct = selectedAnswer.trim() === question.correctAnswer.trim();
    const feedback = correct
      ? `Correct! "${question.correctAnswer}" matches the sandhi rule "${question.ruleId}".`
      : `Incorrect. "${question.dictionaryPinyin}" sandhi is "${question.correctAnswer}" ` +
        `(rule: ${question.ruleId}). You selected "${selectedAnswer}".`;
    return { correct, feedback };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Load all 2-character word candidates from the database.
   */
  private async loadCandidates(): Promise<WordCandidate[]> {
    const words = await prisma.word.findMany({
      where: { simplified: { not: null } },
      include: {
        wordCharacters: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            character: {
              include: {
                characterReadings: {
                  where: { OR: [{ type: "primary" }, { type: null }] },
                  // Deterministically prefer the PLAIN reading (e.g., "yi" over
                  // "yī"): plain ASCII sorts before its tone-marked twin, so
                  // `take: 1` never lands on a pre-marked row whose sandhi form
                  // would collapse into the dictionary form.
                  orderBy: { pinyin: "asc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const candidates: WordCandidate[] = [];

    for (const word of words) {
      if (word.wordCharacters.length !== 2) continue;
      if (!word.simplified) continue;

      const [wc1, wc2] = word.wordCharacters;
      const cr1 = wc1.character.characterReadings[0];
      const cr2 = wc2.character.characterReadings[0];

      if (!cr1 || !cr2) continue;
      if (cr1.tone < 1 || cr1.tone > 4) continue;
      if (cr2.tone < 1 || cr2.tone > 4) continue;

      candidates.push({
        wordId: word.id,
        simplified: word.simplified,
        dictionaryPinyin: word.pinyin || "",
        char1Glyph: wc1.character.glyph,
        char2Glyph: wc2.character.glyph,
        pinyin1Plain: cr1.pinyin,
        pinyin2Plain: cr2.pinyin,
        tone1: cr1.tone,
        tone2: cr2.tone,
      });
    }

    return candidates;
  }

  /**
   * Distribute questions proportionally across rules, then generate them.
   */
  private distributeQuestions(
    total: number,
    byRule: Map<SandhiRuleId, WordCandidate[]>,
  ): DrillQuestion[] {
    const nonEmptyRules = RULES.filter((r) => (byRule.get(r.id)?.length ?? 0) > 0);
    if (nonEmptyRules.length === 0) {
      throw new Error("Failed to distribute sandhi drill questions");
    }

    const questions: DrillQuestion[] = [];
    let qIndex = 0;

    // Round-robin across available rules until we have enough questions
    while (questions.length < total) {
      for (const rule of nonEmptyRules) {
        if (questions.length >= total) break;
        const pool = byRule.get(rule.id)!;
        // Cycle through pool if we've used all candidates
        const candidate = pool[qIndex % pool.length];
        questions.push(this.buildQuestion(candidate, rule, qIndex));
      }
      qIndex++;
    }

    return shuffleArray(questions);
  }

  /**
   * Build a single DrillQuestion from a candidate word and rule.
   */
  private buildQuestion(candidate: WordCandidate, rule: RuleDef, seed: number): DrillQuestion {
    const sandhiForm = rule.sandhiForm(candidate);
    const correctPinyin = `${sandhiForm.pinyin1} ${sandhiForm.pinyin2}`;
    const dictionaryPinyin = `${applyToneMark(candidate.pinyin1Plain, candidate.tone1)} ${applyToneMark(candidate.pinyin2Plain, candidate.tone2)}`;

    // Generate distractors using seeded pseudo-random
    const distractors = this.generateDistractors(candidate, rule.id, correctPinyin, seed);

    const options = shuffleArray([correctPinyin, ...distractors]);

    return {
      id: `sandhi-q-${seed}`,
      characters: candidate.simplified,
      dictionaryPinyin,
      correctAnswer: correctPinyin,
      ruleId: rule.id,
      options,
    };
  }

  /**
   * Generate 3 UNIQUE distractor options for a question.
   *
   * Options must never contain duplicates (duplicate strings collapse into
   * duplicated React list keys in the quiz UI) and never contain the
   * `??? ???` placeholder that made some questions unanswerable.
   */
  private generateDistractors(
    candidate: WordCandidate,
    ruleId: SandhiRuleId,
    correctAnswer: string,
    seed: number,
  ): string[] {
    const dictionaryPinyin = `${applyToneMark(candidate.pinyin1Plain, candidate.tone1)} ${applyToneMark(candidate.pinyin2Plain, candidate.tone2)}`;

    const distractorSet = new Set<string>();
    const add = (variant: string) => {
      if (variant !== correctAnswer && variant !== dictionaryPinyin) {
        distractorSet.add(variant);
      }
    };

    switch (ruleId) {
      case "3-3-sandhi": {
        // Distractor 1: dictionary form (original tones)
        add(dictionaryPinyin);
        // Distractor 2: swap — apply sandhi to second syllable instead
        add(
          `${applyToneMark(candidate.pinyin1Plain, 3)} ${applyToneMark(candidate.pinyin2Plain, 2)}`,
        );
        // Distractor 3: both syllables as tone 1
        add(
          `${applyToneMark(candidate.pinyin1Plain, 1)} ${applyToneMark(candidate.pinyin2Plain, 1)}`,
        );
        break;
      }
      case "bu-before-4th": {
        // Distractor 1: dictionary form
        add(dictionaryPinyin);
        // Distractor 2: wrong sandhi — change second syllable instead
        add(
          `${applyToneMark(candidate.pinyin1Plain, 4)} ${applyToneMark(candidate.pinyin2Plain, 2)}`,
        );
        // Distractor 3: both tone 4
        add(
          `${applyToneMark(candidate.pinyin1Plain, 4)} ${applyToneMark(candidate.pinyin2Plain, 4)}`,
        );
        break;
      }
      case "yi-before-4th": {
        // Distractor 1: dictionary form
        add(dictionaryPinyin);
        // Distractor 2: wrong sandhi — tone 4 instead of 2
        add(
          `${applyToneMark(candidate.pinyin1Plain, 4)} ${applyToneMark(candidate.pinyin2Plain, 4)}`,
        );
        // Distractor 3: both tone 1
        add(
          `${applyToneMark(candidate.pinyin1Plain, 1)} ${applyToneMark(candidate.pinyin2Plain, 1)}`,
        );
        break;
      }
      case "yi-before-non4th": {
        // Distractor 1: dictionary form
        add(dictionaryPinyin);
        // Distractor 2: wrong sandhi — tone 2 instead of 4
        add(
          `${applyToneMark(candidate.pinyin1Plain, 2)} ${applyToneMark(candidate.pinyin2Plain, candidate.tone2)}`,
        );
        // Distractor 3: both tone 1
        add(
          `${applyToneMark(candidate.pinyin1Plain, 1)} ${applyToneMark(candidate.pinyin2Plain, 1)}`,
        );
        break;
      }
    }

    // Fill any remaining slots with deterministic tone variants until we have
    // 3 unique distractors (16 tone-pair combos guarantee we never fall back
    // to `??? ???` placeholders).
    const tonePairs: Array<[number, number]> = [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 1],
      [3, 2],
      [3, 3],
      [3, 4],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 4],
    ];
    for (let offset = 0; distractorSet.size < 3 && offset < tonePairs.length; offset++) {
      const [t1, t2] = tonePairs[(seed + offset) % tonePairs.length];
      add(
        `${applyToneMark(candidate.pinyin1Plain, t1)} ${applyToneMark(candidate.pinyin2Plain, t2)}`,
      );
    }

    return Array.from(distractorSet).slice(0, 3);
  }
}
