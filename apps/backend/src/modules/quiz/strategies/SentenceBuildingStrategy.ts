/**
 * @file apps/backend/src/modules/quiz/strategies/SentenceBuildingStrategy.ts
 * @description Q7 `sentence-building` practice format (Epic 26, AC3a / §26.3.3,
 * §26.4.1).
 *
 * One question per `GrammarExample`: the word bank is the example's segments in
 * a deterministically shuffled order; the canonical answer is that same order
 * joined by a SINGLE ASCII space.
 *
 * The prompt carries the English gloss only — never `chinese` and never
 * `pinyin`, both of which would reveal the word order the learner has to build
 * (§26.3.3).
 *
 * Answer encoding (§26.4.2): `pinyinInput` = ordered tokens joined by one ASCII
 * space, `correctPinyin` = canonical order with the same join, both tones `0`,
 * `category` = `sentence-building`.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { FORMAT_QUIZ_DEFAULTS, parseGrammarSegments, seededShuffle } from "./formatUtils.js";
import { quizFormatFilter } from "./quizFormatBank.js";

export interface SentenceBuildingQuestion {
  id: string;
  promptGlyph: "show";
  /** No audio for this format (§26.3.3). */
  audioKey: "";
  patternContentId: string;
  patternName: string;
  /** The target meaning — the only clue the learner gets. */
  english: string;
  /** Shuffled word bank (a permutation of the canonical token order). */
  tokens: string[];
  /** Number of tokens in the canonical answer. */
  answerLength: number;
  correctPinyin: string;
  correctTone: number;
  category: "sentence-building";
}

/**
 * Build a word bank that is a permutation of `tokens` and is never already in
 * canonical order (which would let the learner commit without doing anything).
 */
function buildWordBank(tokens: string[], seed: string): string[] {
  const bank = seededShuffle(tokens, seed);
  const alreadyCanonical = bank.every((token, index) => token === tokens[index]);
  if (!alreadyCanonical) return bank;
  return [...bank.slice(1), bank[0]];
}

export const sentenceBuildingStrategy = {
  type: "sentence-building",
  ...FORMAT_QUIZ_DEFAULTS,

  async generateQuestions(_userId?: string): Promise<SentenceBuildingQuestion[]> {
    const [patterns, bankRows] = await Promise.all([
      prisma.grammarPattern.findMany({
        orderBy: [{ sortOrder: "asc" }, { content_id: "asc" }],
        select: {
          content_id: true,
          name: true,
          examples: {
            orderBy: [{ sortOrder: "asc" }, { content_id: "asc" }],
            select: { content_id: true, english: true, segments: true },
          },
        },
      }),
      // Curated bank (§26.4.3): the pinned `GrammarExample` anchors, in anchor
      // order. Empty → the generated corpus path below runs instead.
      prisma.grammarExample.findMany({
        where: quizFormatFilter("sentence-building"),
        orderBy: [{ pattern: { sortOrder: "asc" } }, { sortOrder: "asc" }, { content_id: "asc" }],
        select: { content_id: true },
      }),
    ]);

    const examplesById = new Map<
      string,
      {
        patternContentId: string;
        patternName: string;
        example: (typeof patterns)[number]["examples"][number];
      }
    >();
    for (const pattern of patterns) {
      for (const example of pattern.examples) {
        examplesById.set(example.content_id, {
          patternContentId: pattern.content_id,
          patternName: pattern.name,
          example,
        });
      }
    }

    function build(anchor: {
      patternContentId: string;
      patternName: string;
      example: (typeof patterns)[number]["examples"][number];
    }): SentenceBuildingQuestion | null {
      const tokens = parseGrammarSegments(anchor.example.segments).map((segment) => segment.text);
      // A single token is not a sentence to assemble (fail-open: skip it).
      if (tokens.length < 2) return null;
      return {
        id: `sbo-${anchor.example.content_id}`,
        promptGlyph: "show",
        audioKey: "",
        patternContentId: anchor.patternContentId,
        patternName: anchor.patternName,
        english: anchor.example.english,
        tokens: buildWordBank(tokens, anchor.example.content_id),
        answerLength: tokens.length,
        correctPinyin: tokens.join(" "),
        correctTone: 0,
        category: "sentence-building",
      };
    }

    const bankQuestions = bankRows
      .map((row) => examplesById.get(row.content_id))
      .filter((anchor) => anchor !== undefined)
      .map((anchor) => build(anchor))
      .filter((question): question is SentenceBuildingQuestion => question !== null);
    if (bankQuestions.length > 0) return bankQuestions;

    const questions: SentenceBuildingQuestion[] = [];
    for (const anchor of examplesById.values()) {
      const question = build(anchor);
      if (question) questions.push(question);
    }

    return questions;
  },
};
