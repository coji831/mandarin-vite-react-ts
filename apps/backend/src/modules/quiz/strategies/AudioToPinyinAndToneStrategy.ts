/**
 * @file apps/backend/src/modules/quiz/strategies/AudioToPinyinAndToneStrategy.ts
 * Combined Audio-to-Pinyin-and-Tone quiz strategy.
 * Generates questions from PinyinSyllable + PinyinCharacterMapping and evaluates BOTH pinyin and tone.
 *
 * Data source: PinyinSyllable (replaces deprecated PinyinCombination)
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { shuffleArray } from "../../../shared/utils/contentUtils.js";
import {
  isSandhiAcceptable,
  areTonesEquivalent,
  normalizePinyinForComparison,
  normalizeTone,
  stripToneAndDigits,
} from "@mandarin/shared-utils";

/**
 * Characters that are typically pronounced with neutral tone (tone 0)
 * in natural speech, regardless of their lexical tone.
 */
const NEUTRAL_TONE_PARTICLES = new Set(["吗", "了", "的", "着", "过", "们", "子"]);

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

    // Get character mappings for syllables that have them.
    // Representative = first row per syllablePretty after ordering by
    // representativeRank asc (nulls LAST) then id asc. `isDefault` is NOT a
    // filter here — it marks the primary reading per CHARACTER, not the
    // per-syllable representative (a syllable can have many isDefault rows).
    const mappings = await prisma.pinyinCharacterMapping.findMany({
      orderBy: [{ representativeRank: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      select: {
        pinyinSyllable: { select: { syllablePretty: true, syllable: true } },
        character: { select: { glyph: true } },
      },
    });

    const charBySyllable = new Map<string, string>();
    for (const m of mappings) {
      const syl = m.pinyinSyllable.syllablePretty;
      if (!charBySyllable.has(syl)) {
        charBySyllable.set(syl, m.character.glyph);
      }
    }

    const shuffled = shuffleArray([...syllables]);
    return shuffled.map((entry, index) => {
      const character = charBySyllable.get(entry.syllablePretty) || null;

      // Determine effective tone — apply neutral tone for whitelisted particles
      let effectiveTone = entry.tone;
      if (character && NEUTRAL_TONE_PARTICLES.has(character)) {
        effectiveTone = 0;
      }

      // Detect sandhi: a 3rd-tone syllable is a potential 3-3 sandhi candidate
      const isSandhiQuestion = effectiveTone === 3;
      const sandhiRule = isSandhiQuestion ? "3-3" : undefined;

      return {
        id: `q-${index + 1}`,
        audioKey: entry.syllable,
        correctPinyin: stripToneAndDigits(entry.syllable), // "ba1" → "ba" — payload must be digitless
        correctTone: normalizeTone(effectiveTone), // lexical neutral (5) → canonical 0
        category: effectiveTone === 0 ? "tones" : Math.random() > 0.5 ? "pinyin" : "tones",
        displayPinyin: entry.syllablePretty,
        character,
        meaning: null,
        isSandhiQuestion,
        sandhiRule,
      };
    });
  },

  validateAnswer(
    question: {
      correctPinyin: string;
      correctTone: number;
      displayPinyin?: string;
      isSandhiQuestion?: boolean;
      sandhiRule?: string;
    },
    { pinyin, tone }: { pinyin: string; tone: number },
  ) {
    // G9: accept both digitless ("xiang") and digit-suffixed ("xiang4")
    // pinyin for the same syllable.
    const pinyinCorrect =
      normalizePinyinForComparison(pinyin) === normalizePinyinForComparison(question.correctPinyin);
    // G2: neutral tone 0 and 5 are equivalent (轻声).
    const toneCorrect = areTonesEquivalent(tone, question.correctTone);

    // Sandhi-aware: accept tone 2 for 3-3 sandhi contexts
    const sandhiAccepted =
      !toneCorrect &&
      isSandhiAcceptable(
        question.correctTone,
        tone,
        !!question.isSandhiQuestion,
        question.sandhiRule,
      );

    const correct = pinyinCorrect && (toneCorrect || sandhiAccepted);
    let feedback;
    if (correct) {
      const toneNote = sandhiAccepted
        ? ` (tone ${tone} accepted via ${question.sandhiRule} sandhi rule)`
        : "";
      feedback = `Correct! "${question.displayPinyin || question.correctPinyin}" — perfect pinyin and tone.${toneNote}`;
    } else {
      const parts = [];
      if (!pinyinCorrect) parts.push("pinyin");
      if (!toneCorrect && !sandhiAccepted) parts.push("tone");
      feedback = `The correct answer was "${question.displayPinyin || question.correctPinyin}". ${parts.join(" and ")} ${parts.length > 1 ? "were" : "was"} incorrect.`;
    }
    return { correct, feedback };
  },
};
