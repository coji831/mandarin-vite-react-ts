/**
 * @file apps/backend/src/modules/quiz/strategies/ClozeStrategy.ts
 * @description Q6 `cloze` practice format (Epic 26, AC3a / §26.3.2, §26.4.1).
 *
 * Generates one fill-in-the-blank question per `GrammarExample`: one segment of
 * the sentence is blanked and three distractors are drawn from segments of the
 * SAME character length found in other patterns' examples, so a distractor is
 * always a plausible token of the same shape.
 *
 * Read path (§26.4.3): anchors carrying `metadata.quizFormats` for `cloze` are
 * preferred (the curated bank pins the blanked segment); when the bank is
 * absent or yields nothing the generated corpus path runs instead, so thin or
 * unseeded content still serves questions. The bank never stores an answer —
 * every token below is read from the anchored row.
 *
 * Answer encoding (§26.4.2): `pinyinInput` = filled token, `correctPinyin` =
 * expected token, both tones `0` (sentinel — this is not a tone answer),
 * `category` = `cloze`.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import {
  FORMAT_QUIZ_DEFAULTS,
  parseGrammarSegments,
  stableHash,
  tokenLength,
} from "./formatUtils.js";
import { bankItemsFor, quizFormatFilter } from "./quizFormatBank.js";

/** One selectable token in a cloze question (FE `QuizOption` shape). */
export interface ClozeOption {
  id: string;
  glyph: string;
  meaning: string;
}

export interface ClozeQuestion {
  id: string;
  promptGlyph: "show";
  /** No audio for this format (§26.3.2). */
  audioKey: "";
  patternContentId: string;
  patternName: string;
  patternStructure: string;
  explanation: string;
  chinese: string;
  pinyin: string;
  english: string;
  /** Index (into `segments`) of the blanked token. */
  blankIndex: number;
  segments: Array<{ text: string; pinyin: string; blank: boolean }>;
  options: ClozeOption[];
  correctPinyin: string;
  correctTone: number;
  category: "cloze";
  displayPinyin: string;
}

interface ClozeExample {
  content_id: string;
  chinese: string;
  pinyin: string;
  english: string;
  segments: unknown;
}

interface ClozePattern {
  content_id: string;
  name: string;
  structure: string;
  explanation: string;
  examples: ClozeExample[];
}

/** The default blanked segment: the sentence's final one (usually the object). */
function defaultBlankIndex(segments: ReturnType<typeof parseGrammarSegments>): number {
  return segments.length - 1;
}

/**
 * Index every segment token by code-point length → (token → first gloss seen).
 * Glosses are kept for the distractors so a distractor option is not blank.
 */
function indexTokensByLength(
  examples: ReadonlyArray<{ segments: unknown }>,
): Map<number, Map<string, string>> {
  const byLength = new Map<number, Map<string, string>>();
  for (const example of examples) {
    for (const segment of parseGrammarSegments(example.segments)) {
      const length = tokenLength(segment.text);
      const bucket = byLength.get(length) ?? new Map<string, string>();
      if (!bucket.has(segment.text)) bucket.set(segment.text, segment.gloss);
      byLength.set(length, bucket);
    }
  }
  return byLength;
}

/** Build one question, or `null` when the row cannot carry a fair one. */
function buildClozeQuestion(params: {
  example: ClozeExample;
  pattern: ClozePattern;
  tokensByLength: Map<number, Map<string, string>>;
  blankIndex?: number;
}): ClozeQuestion | null {
  const { example, pattern, tokensByLength } = params;
  const segments = parseGrammarSegments(example.segments);
  if (segments.length < 2) return null;

  const requested = params.blankIndex;
  const blankIndex =
    requested !== undefined &&
    Number.isInteger(requested) &&
    requested >= 0 &&
    requested < segments.length
      ? requested
      : defaultBlankIndex(segments);

  const answer = segments[blankIndex].text;
  const distractors = [...(tokensByLength.get(tokenLength(answer)) ?? new Map<string, string>())]
    .filter(([token]) => token !== answer)
    .sort(
      ([tokenA], [tokenB]) =>
        stableHash(`${example.content_id}:${tokenA}`) -
          stableHash(`${example.content_id}:${tokenB}`) || tokenA.localeCompare(tokenB),
    )
    .slice(0, 3);
  // A question without three same-length distractors would be a giveaway; skip
  // it and keep the rest of the corpus (fail-open, never throw).
  if (distractors.length < 3) return null;

  const options: ClozeOption[] = [
    { id: "opt-0", glyph: answer, meaning: segments[blankIndex].gloss },
    ...distractors.map(([token, gloss], index) => ({
      id: `opt-${index + 1}`,
      glyph: token,
      meaning: gloss,
    })),
  ];
  const rotation = stableHash(example.content_id) % options.length;
  const orderedOptions = [...options.slice(rotation), ...options.slice(0, rotation)];

  return {
    id: `cloze-${example.content_id}`,
    promptGlyph: "show",
    audioKey: "",
    patternContentId: pattern.content_id,
    patternName: pattern.name,
    patternStructure: pattern.structure,
    explanation: pattern.explanation,
    chinese: example.chinese,
    pinyin: example.pinyin,
    english: example.english,
    blankIndex,
    segments: segments.map((segment, index) => ({
      text: segment.text,
      pinyin: segment.pinyin,
      blank: index === blankIndex,
    })),
    options: orderedOptions,
    correctPinyin: answer,
    correctTone: 0,
    category: "cloze",
    displayPinyin: example.pinyin,
  };
}

export const clozeStrategy = {
  type: "cloze",
  ...FORMAT_QUIZ_DEFAULTS,

  async generateQuestions(_userId?: string): Promise<ClozeQuestion[]> {
    const [patterns, bankRows] = await Promise.all([
      prisma.grammarPattern.findMany({
        orderBy: [{ sortOrder: "asc" }, { content_id: "asc" }],
        select: {
          content_id: true,
          name: true,
          structure: true,
          explanation: true,
          examples: {
            orderBy: [{ sortOrder: "asc" }, { content_id: "asc" }],
            select: {
              content_id: true,
              chinese: true,
              pinyin: true,
              english: true,
              segments: true,
            },
          },
        },
      }),
      // Curated bank (§26.4.3) — anchors carrying a `cloze` bank item, ordered
      // by the anchor's position (pattern sortOrder, then example sortOrder).
      prisma.grammarExample.findMany({
        where: quizFormatFilter("cloze"),
        orderBy: [{ pattern: { sortOrder: "asc" } }, { sortOrder: "asc" }, { content_id: "asc" }],
        select: { content_id: true, metadata: true },
      }),
    ]);

    const tokensByLength = indexTokensByLength(patterns.flatMap((pattern) => pattern.examples));

    const examplesById = new Map<string, { example: ClozeExample; pattern: ClozePattern }>();
    for (const pattern of patterns) {
      for (const example of pattern.examples) {
        examplesById.set(example.content_id, { example, pattern });
      }
    }

    const bankQuestions: ClozeQuestion[] = [];
    for (const row of bankRows) {
      const entry = examplesById.get(row.content_id);
      const [item] = bankItemsFor(row.metadata, "cloze");
      if (!entry || !item) continue;
      const question = buildClozeQuestion({
        ...entry,
        tokensByLength,
        blankIndex: item.blankSegmentIndex,
      });
      if (question) bankQuestions.push(question);
    }
    if (bankQuestions.length > 0) return bankQuestions;

    const questions: ClozeQuestion[] = [];
    for (const pattern of patterns) {
      for (const example of pattern.examples) {
        const question = buildClozeQuestion({ example, pattern, tokensByLength });
        if (question) questions.push(question);
      }
    }
    return questions;
  },
};
