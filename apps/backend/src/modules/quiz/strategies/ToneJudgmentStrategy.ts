/**
 * @file apps/backend/src/modules/quiz/strategies/ToneJudgmentStrategy.ts
 * @description Q10 `tone-judgment` practice format (Epic 26, AC3b / §26.3.5,
 * §26.4.1, §26.4.2).
 *
 * A DISTINCT Phase-1 format, not an `audio-to-tone` sub-mode: the stimulus is
 * WRITTEN pinyin, there is no audio and no TTS, and the question exercises the
 * tone RULE rather than the ear.
 *
 * Read path (§26.4.3): `GrammarExample` anchors carrying a `tone-judgment` bank
 * item win — the item pins `targetSegmentIndex` and the `ruleId`, and the
 * surface tone is DERIVED from the labelled segments (3rd-tone sandhi: base 3
 * before another base 3 surfaces as 2). When no bank exists the generated
 * sources below run instead, so the format still serves questions:
 *   1. `TonePair` — the only corpus row that stores a SURFACE tone
 *      (`spokenPinyin`) alongside the dictionary tone (`dictionaryPinyin`).
 *   2. `PinyinSyllable` + its representative `PinyinCharacterMapping` — the
 *      written syllable in context (tone-marked syllable + its character);
 *      surface tone equals the lexical tone, `ruleId: null`.
 *
 * Answer encoding (§26.4.2): `pinyinInput` = the syllable judged,
 * `selectedTone` = chosen 0-4, `correctPinyin` = that syllable,
 * `correctTone` = expected surface tone, `category` = `tone-judgment`.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { extractToneNumber, normalizeTone } from "@mandarin/shared-utils";
import { FORMAT_QUIZ_DEFAULTS, parseGrammarSegments, stableHash } from "./formatUtils.js";
import { bankItemsFor, quizFormatFilter } from "./quizFormatBank.js";
import type { QuizFormatBankItem } from "./quizFormatBank.js";

export interface ToneJudgmentQuestion {
  id: string;
  promptGlyph: "show";
  /** Written stimulus only — no audio, so no TTS key (§26.3.5). */
  audioKey: "";
  /** The written phrase (or the single character carrying the syllable). */
  chinese: string;
  dictionaryPinyin: string;
  /** Index of the judged syllable inside `dictionaryPinyin`. */
  targetIndex: number;
  targetGlyph: string;
  /** The judged syllable, tone-marked as written. */
  targetSyllable: string;
  /** Dictionary tone — equals `correctTone` when no rule applies. */
  baseTone: number;
  ruleId: string | null;
  ruleTitle: string | null;
  correctPinyin: string;
  correctTone: number;
  category: "tone-judgment";
}

interface ToneRuleRow {
  id: string;
  title: string;
  examples: unknown;
}

/** Split a tone-marked pinyin phrase into syllables. */
function splitSyllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/).filter(Boolean);
}

/** Index of the first syllable whose surface tone differs from its base tone. */
function firstChangedIndex(dictionary: string[], spoken: string[]): number | null {
  const length = Math.min(dictionary.length, spoken.length);
  for (let index = 0; index < length; index += 1) {
    // Tone 0 is a legal neutral tone, so "differs" is a real comparison of
    // numbers — nothing here infers "not a tone answer" from `tone === 0`
    // (§26.4.2: the discriminator is `category`/`quizType`).
    if (extractToneNumber(dictionary[index]) !== extractToneNumber(spoken[index])) {
      return index;
    }
  }
  return null;
}

/** Map a `TonePair` phrase → the `ToneRule` that documents it (or null). */
function resolveRuleId(
  chinese: string,
  rules: ReadonlyArray<ToneRuleRow>,
): { ruleId: string | null; ruleTitle: string | null } {
  for (const rule of rules) {
    if (!Array.isArray(rule.examples)) continue;
    const documented = rule.examples.some(
      (example) =>
        Boolean(example) &&
        typeof example === "object" &&
        (example as { chinese?: unknown }).chinese === chinese,
    );
    if (documented) return { ruleId: rule.id, ruleTitle: rule.title };
  }
  return { ruleId: null, ruleTitle: null };
}

/**
 * Apply a tone rule to a base (dictionary) tone.
 * Only the 3-3 sandhi rule is modelled here: a 3rd tone before another 3rd tone
 * surfaces as the 2nd. Every other case is "no change".
 */
function surfaceTone(
  baseTone: number,
  nextTone: number | undefined,
  ruleId: string | null,
): number {
  if (ruleId === "rule-3rd-sandhi" && baseTone === 3 && nextTone === 3) return 2;
  return baseTone;
}

/** Build a bank-anchored question from a `GrammarExample` row. */
function buildBankQuestion(
  row: { content_id: string; chinese: string; pinyin: string; segments: unknown },
  item: QuizFormatBankItem,
  rules: ReadonlyArray<ToneRuleRow>,
): ToneJudgmentQuestion | null {
  const segments = parseGrammarSegments(row.segments);
  const targetIndex = item.targetSegmentIndex;
  if (
    targetIndex === undefined ||
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex >= segments.length
  ) {
    return null;
  }

  const target = segments[targetIndex];
  const baseTone = normalizeTone(extractToneNumber(target.pinyin));
  const next = segments[targetIndex + 1];
  const nextTone = next ? normalizeTone(extractToneNumber(next.pinyin)) : undefined;
  const ruleId = item.ruleId ?? null;
  const rule = ruleId ? rules.find((candidate) => candidate.id === ruleId) : undefined;

  return {
    id: `tsj-${item.id}`,
    promptGlyph: "show",
    audioKey: "",
    chinese: row.chinese,
    dictionaryPinyin: row.pinyin,
    targetIndex,
    targetGlyph: target.text,
    targetSyllable: target.pinyin,
    baseTone,
    ruleId,
    ruleTitle: rule?.title ?? null,
    correctPinyin: target.pinyin,
    correctTone: surfaceTone(baseTone, nextTone, ruleId),
    category: "tone-judgment",
  };
}

export const toneJudgmentStrategy = {
  type: "tone-judgment",
  ...FORMAT_QUIZ_DEFAULTS,

  async generateQuestions(_userId?: string): Promise<ToneJudgmentQuestion[]> {
    const [tonePairs, toneRules, syllables, mappings, bankRows] = await Promise.all([
      prisma.tonePair.findMany({
        orderBy: { id: "asc" },
        select: {
          id: true,
          chinese: true,
          dictionaryPinyin: true,
          spokenPinyin: true,
          rule: true,
        },
      }),
      prisma.toneRule.findMany({
        orderBy: { id: "asc" },
        select: { id: true, title: true, examples: true },
      }),
      prisma.pinyinSyllable.findMany({
        orderBy: [{ syllable: "asc" }],
        select: { syllable: true, syllablePretty: true, tone: true },
      }),
      // Representative character per syllable: rank asc with NULLS LAST, then
      // id asc (same selection the audio strategy uses).
      prisma.pinyinCharacterMapping.findMany({
        orderBy: [{ representativeRank: { sort: "asc", nulls: "last" } }, { id: "asc" }],
        select: {
          pinyinSyllable: { select: { syllablePretty: true } },
          character: { select: { glyph: true } },
        },
      }),
      // Curated bank (§26.4.3): pinned `GrammarExample` anchors, anchor order.
      prisma.grammarExample.findMany({
        where: quizFormatFilter("tone-judgment"),
        orderBy: [{ pattern: { sortOrder: "asc" } }, { sortOrder: "asc" }, { content_id: "asc" }],
        select: { content_id: true, chinese: true, pinyin: true, segments: true, metadata: true },
      }),
    ]);

    // ── Curated bank first ────────────────────────────────────────────────
    const bankQuestions: ToneJudgmentQuestion[] = [];
    for (const row of bankRows) {
      const [item] = bankItemsFor(row.metadata, "tone-judgment");
      if (!item) continue;
      const question = buildBankQuestion(row, item, toneRules);
      if (question) bankQuestions.push(question);
    }
    if (bankQuestions.length > 0) return bankQuestions;

    const questions: ToneJudgmentQuestion[] = [];

    // ── Sandhi items (`TonePair` + `ToneRule`) ────────────────────────────
    for (const pair of tonePairs) {
      const dictionary = splitSyllables(pair.dictionaryPinyin ?? "");
      const spoken = splitSyllables(pair.spokenPinyin ?? "");
      if (dictionary.length === 0 || dictionary.length !== spoken.length) continue;

      // Prefer the syllable the rule actually changes; a pair whose base tone
      // already equals its surface tone is the §26.3.5 "no change" edge case.
      const targetIndex = firstChangedIndex(dictionary, spoken) ?? 0;
      const { ruleId, ruleTitle } = resolveRuleId(pair.chinese, toneRules);

      questions.push({
        id: `tsj-pair-${pair.id}`,
        promptGlyph: "show",
        audioKey: "",
        chinese: pair.chinese,
        dictionaryPinyin: dictionary.join(" "),
        targetIndex,
        targetGlyph: [...pair.chinese][targetIndex] ?? pair.chinese,
        targetSyllable: dictionary[targetIndex],
        baseTone: normalizeTone(extractToneNumber(dictionary[targetIndex])),
        ruleId,
        ruleTitle,
        correctPinyin: dictionary[targetIndex],
        correctTone: normalizeTone(extractToneNumber(spoken[targetIndex])),
        category: "tone-judgment",
      });
    }

    // ── Written-syllable fallback (`PinyinSyllable` + mapping) ────────────
    const glyphBySyllable = new Map<string, string>();
    for (const mapping of mappings) {
      const syllable = mapping.pinyinSyllable?.syllablePretty;
      const glyph = mapping.character?.glyph;
      if (!syllable || !glyph || glyphBySyllable.has(syllable)) continue;
      glyphBySyllable.set(syllable, glyph);
    }

    const seenSyllables = new Set<string>();
    const syllableItems = syllables
      .filter((syllable) => {
        if (seenSyllables.has(syllable.syllable)) return false;
        seenSyllables.add(syllable.syllable);
        return true;
      })
      .sort(
        (a, b) =>
          stableHash(a.syllablePretty) - stableHash(b.syllablePretty) ||
          a.syllable.localeCompare(b.syllable),
      );

    for (const syllable of syllableItems) {
      const pinyin = syllable.syllablePretty || syllable.syllable;
      questions.push({
        id: `tsj-syl-${syllable.syllable}`,
        promptGlyph: "show",
        audioKey: "",
        chinese: glyphBySyllable.get(syllable.syllablePretty) ?? "",
        dictionaryPinyin: pinyin,
        targetIndex: 0,
        targetGlyph: glyphBySyllable.get(syllable.syllablePretty) ?? "",
        targetSyllable: pinyin,
        baseTone: normalizeTone(syllable.tone),
        ruleId: null,
        ruleTitle: null,
        correctPinyin: pinyin,
        correctTone: normalizeTone(syllable.tone),
        category: "tone-judgment",
      });
    }

    return questions;
  },
};
