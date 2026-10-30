/**
 * @file apps/backend/src/modules/quiz/strategies/ListeningDictationStrategy.ts
 * @description Q9 `listening-dictation` practice format (Epic 26, AC3b / §26.3.4,
 * §26.4.1).
 *
 * Character-level only — word-level dictation is explicitly deferred. The audio
 * target is the character GLYPH (TTS renders it; the glyph is never printed —
 * the question carries `promptGlyph: "hide"`). The answer is that character's
 * primary reading in TONE-MARKED pinyin, which is exactly the `correctPinyin`
 * contract of §26.4.2, and it keeps grading on the existing
 * `normalizePinyinForComparison` path (so `ni3 hao3` is accepted).
 *
 * Answer encoding (§26.4.2): `pinyinInput` = the transcription as typed
 * (trimmed), `correctPinyin` = expected tone-marked pinyin, both tones `0`,
 * `category` = `dictation`.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { FORMAT_QUIZ_DEFAULTS } from "./formatUtils.js";
import { quizFormatFilter } from "./quizFormatBank.js";

/** How many dictation items one session serves (Epic 27 re-calibrates). */
const DICTATION_ITEM_COUNT = FORMAT_QUIZ_DEFAULTS.questionCount;

/** One entry of `Character.readings` (`Json` — validated at read time). */
interface CharacterReading {
  pinyin: string;
  tone: number;
  type: string;
}

export interface ListeningDictationQuestion {
  id: string;
  promptGlyph: "hide";
  /** TTS key — the glyph itself (§26.3.4: "TTS from the row's glyph"). */
  audioKey: string;
  character: string;
  displayPinyin: string;
  meaning: string;
  hskLevel?: number;
  correctPinyin: string;
  correctTone: number;
  category: "dictation";
}

/** Read `Character.readings`, preferring the `primary` row. */
function parseReadings(value: unknown): CharacterReading[] {
  if (!Array.isArray(value)) return [];
  const readings: CharacterReading[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.pinyin !== "string" || !record.pinyin.trim()) continue;
    readings.push({
      pinyin: record.pinyin.trim(),
      tone: typeof record.tone === "number" ? record.tone : 0,
      type: typeof record.type === "string" ? record.type : "",
    });
  }
  // Stable: primary reading first, everything else in corpus order.
  return [
    ...readings.filter((reading) => reading.type === "primary"),
    ...readings.filter((reading) => reading.type !== "primary"),
  ];
}

export const listeningDictationStrategy = {
  type: "listening-dictation",
  ...FORMAT_QUIZ_DEFAULTS,

  async generateQuestions(_userId?: string): Promise<ListeningDictationQuestion[]> {
    // Curated bank first (§26.4.3): the pinned `Character` anchors, in
    // familiar-first order. The bank is a SELECTION, so it can never grow the
    // pool beyond what the corpus holds — an empty bank falls back to the
    // generated query below (fail-open: return what exists, never throw).
    const selection = {
      select: {
        id: true,
        glyph: true,
        definition: true,
        readings: true,
        hskLevel: true,
        frequencyRank: true,
      },
      orderBy: [
        { hskLevel: { sort: "asc" as const, nulls: "last" as const } },
        { frequencyRank: { sort: "asc" as const, nulls: "last" as const } },
        { id: "asc" as const },
      ],
    };

    // Familiar-first pool: HSK level asc (nulls last), then frequency rank asc
    // (nulls last), then id — a deterministic order, so the same characters are
    // proposed on every call. Over-fetch because characters without a reading
    // are filtered out below.
    const bankRows = await prisma.character.findMany({
      where: quizFormatFilter("listening-dictation"),
      ...selection,
    });
    const characters =
      bankRows.length > 0
        ? bankRows
        : await prisma.character.findMany({
            ...selection,
            take: Math.max(DICTATION_ITEM_COUNT * 3, DICTATION_ITEM_COUNT),
          });

    const questions: ListeningDictationQuestion[] = [];
    const seenGlyphs = new Set<string>();
    for (const character of characters) {
      if (seenGlyphs.has(character.glyph)) continue;
      const primary = parseReadings(character.readings)[0];
      if (!primary) continue;
      seenGlyphs.add(character.glyph);

      questions.push({
        id: `dct-${character.id}`,
        promptGlyph: "hide",
        audioKey: character.glyph,
        character: character.glyph,
        displayPinyin: primary.pinyin,
        meaning: character.definition?.trim() ?? "",
        hskLevel: character.hskLevel ?? undefined,
        correctPinyin: primary.pinyin,
        correctTone: 0,
        category: "dictation",
      });
      if (questions.length >= DICTATION_ITEM_COUNT) break;
    }

    return questions;
  },
};
