/**
 * @file apps/backend/src/modules/foundations/services/FoundationsService.ts
 * @description Business logic for foundations reference data
 *
 * Data sources (all-in-DB):
 *   - getPinyinTonesPool: PinyinPhoneme + Tone + TonePair + ToneRule (Prisma)
 *   - getPinyinCharacterMap: PinyinCharacterMapping (Prisma junction table)
 *   - getStrokesReference: prisma.strokeCategory + prisma.strokeOrderRule
 *   - getCharacterByGlyph: prisma.character (no JSON fallback)
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { PinyinCharacterMap } from "@mandarin/shared-utils";
import type {
  ComboPair,
  PinyinComboRow,
  PinyinTonesPool,
  StrokesReference,
  CharacterDetailResponse,
} from "../types/foundations.js";

const logger = createLogger("FoundationsService");

/**
 * Group PinyinSyllable records by initial+final pair into 5-slot tone arrays.
 * @param syllables - Raw records from PinyinSyllable table (replaces deprecated PinyinCombination)
 * @returns Pool-shaped combo objects with tones[5] arrays
 */
function groupCombosByPair(syllables: PinyinComboRow[]): ComboPair[] {
  const comboMap = new Map<string, { initial: string; final: string; tones: (string | null)[] }>();
  for (const s of syllables) {
    const key = `${s.initial ?? ""}-${s.final ?? ""}`;
    if (!comboMap.has(key)) {
      comboMap.set(key, { initial: s.initial ?? "", final: s.final ?? "", tones: [] });
    }
    const entry = comboMap.get(key)!;
    const toneIdx = s.tone === 0 ? 4 : s.tone - 1;
    entry.tones[toneIdx] = s.syllable;
  }
  return Array.from(comboMap.values()).map((c) => ({
    initial: c.initial.replace(/^init_/, ""),
    final: c.final.replace(/^fin_/, ""),
    tones: Array.from({ length: 5 }, (_, i) => c.tones[i] || null),
  }));
}

export class FoundationsService {
  /**
   * Build the full PinyinTonesPool from the reference tables + PinyinSyllable.
   * The reference tables (PinyinPhoneme, Tone, TonePair, ToneRule) provide the
   * entity attributes; PinyinSyllable provides init×fin×tone mappings.
   * All-in-DB — no content/*.json reads at runtime.
   * @returns Pool-shaped object matching the legacy format
   */
  async getPinyinTonesPool(): Promise<PinyinTonesPool> {
    try {
      const [allPhonemes, toneInfo, tonePairs, toneRules] = await Promise.all([
        prisma.pinyinPhoneme.findMany(),
        prisma.tone.findMany({ orderBy: { number: "asc" } }),
        prisma.tonePair.findMany(),
        prisma.toneRule.findMany(),
      ]);

      // Filter by phoneme type
      const initials = allPhonemes.filter((p) => p.phonemeType === "initial");
      const finals = allPhonemes.filter((p) => p.phonemeType === "final");

      // Read all syllables from PinyinSyllable (replaces deprecated PinyinCombination)
      const syllables = await prisma.pinyinSyllable.findMany();

      // Group by initial+final for the pool shape (5-slot tone array per combo)
      const combined = groupCombosByPair(syllables);

      return {
        initials: initials.map((i) => ({
          id: i.pinyin,
          pinyin: i.pinyin,
          ipa: i.ipa || null,
          description: i.pronunciationGuide || i.description || "",
        })),
        finals: finals.map((f) => ({
          id: f.pinyin,
          pinyin: f.pinyin,
          type: f.type === "simple" || f.type === "simple_final" ? "simple" : "compound",
          description: f.pronunciationGuide || "",
        })),
        combinations: combined,
        toneInfo: toneInfo.map((t) => ({
          number: t.number,
          name: t.name,
          mark: t.mark || "",
          pinyinExample: t.exampleSyllable || "",
          chineseExample: t.exampleCharacter || "",
          description: t.pitchDescription || "",
          contour: (t.contour as number[] | null) || null,
          color: t.color || "",
        })),
        tonePairs: tonePairs.map((p) => ({
          id: p.id,
          chinese: p.chinese,
          dictionaryPinyin: p.dictionaryPinyin,
          spokenPinyin: p.spokenPinyin,
          rule: p.rule,
          pattern: p.pattern,
        })),
        toneRules: toneRules.map((r) => ({
          id: r.id,
          title: r.title,
          rule: r.rule,
          examples: r.examples,
        })),
      };
    } catch (err) {
      logger.error("[FoundationsService] Failed to build pinyin-tones pool", err);
      throw err;
    }
  }

  /**
   * Get a pinyin-to-character mapping from PinyinCharacterMapping.
   * Representative = first row per syllablePretty after ordering by
   * representativeRank asc (nulls LAST) then id asc — deterministic,
   * independent of physical insert order. `representativeRank` is stamped by
   * the enrich pipeline (0 = representative); NULLS LAST is required because
   * Postgres ASC defaults to NULLS FIRST.
   * @returns Map of syllable -> character
   */
  async getPinyinCharacterMap(): Promise<PinyinCharacterMap> {
    const mappings = await prisma.pinyinCharacterMapping.findMany({
      orderBy: [{ representativeRank: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      include: {
        pinyinSyllable: { select: { syllablePretty: true } },
        character: { select: { glyph: true } },
      },
    });
    const map: PinyinCharacterMap = {};
    for (const mapping of mappings) {
      const syl = mapping.pinyinSyllable.syllablePretty;
      if (syl && !map[syl]) {
        map[syl] = mapping.character.glyph;
      }
    }
    return map;
  }

  /**
   * Get the strokes reference data from the database.
   * @returns Strokes data (strokes, strokeOrderRules, suggestedCharacters)
   */
  async getStrokesReference(): Promise<StrokesReference> {
    try {
      const categories = await prisma.strokeCategory.findMany({
        orderBy: { order: "asc" },
        include: { extendedTypes: { orderBy: { order: "asc" } } },
      });
      const orderRules = await prisma.strokeOrderRule.findMany({
        orderBy: { number: "asc" },
      });

      return {
        strokes: categories.map((c) => ({
          id: c.id,
          glyph: c.glyph ?? "",
          pinyin: c.pinyin,
          meaning: c.meaning,
          order: c.order,
          strokeCount: c.strokeCount,
          exampleChars: c.exampleChars,
          extendedTypes: c.extendedTypes.map((e) => ({
            id: e.id,
            glyph: e.glyph ?? "",
            pinyin: e.pinyin,
            meaning: e.meaning,
            order: e.order,
          })),
        })),
        strokeOrderRules: orderRules.map((r) => ({
          id: r.id,
          number: r.number,
          name: r.name,
          description: r.description,
          examples: r.examples,
          example: r.examples[0] ?? "", // backward compat — frontend expects singular
          rule: r.description, // backward compat — frontend expects "rule" field
        })),
        suggestedCharacters: ["一", "丨", "人", "大", "口", "水", "火", "木", "日", "月"],
      };
    } catch (err) {
      logger.error("[FoundationsService] Failed to load strokes reference", err);
      throw err;
    }
  }

  /**
   * Get character detail data by glyph.
   * Reads from the Character table (Prisma) — all-in-DB. The legacy
   * content/characters/ JSON fallback was removed (DB is always authoritative).
   * @param glyph - The Chinese character glyph (e.g. "好")
   * @returns Character detail or null if not found
   */
  async getCharacterByGlyph(glyph: string): Promise<CharacterDetailResponse | null> {
    try {
      const character = await prisma.character.findUnique({
        where: { glyph },
      });

      if (!character) return null;

      const readings =
        (character.readings as Array<{
          pinyin: string;
          tone: number;
          type: string;
          meaning: string;
        }> | null) || [];

      // Load radicals from CharacterRadical table
      const radicalLinks = await prisma.characterRadical.findMany({
        where: { characterGlyph: glyph },
      });

      return {
        glyph: character.glyph,
        traditional: character.traditional || character.glyph,
        strokeCount: character.strokeCount,
        hskLevel: character.hskLevel ?? 0,
        readings: readings.map((r) => ({
          pinyin: r.pinyin,
          tone: r.tone,
          type: r.type,
          core_meaning: r.meaning,
        })),
        etymology: character.etymology || undefined,
        frequencyRank: character.frequencyRank || undefined,
        commonWords: character.commonWords.length > 0 ? character.commonWords : undefined,
        radicalIds: radicalLinks.map((r) => r.radicalId),
        definition: character.definition || undefined,
      };
    } catch (err) {
      logger.error(`[FoundationsService] Failed to get character "${glyph}"`, err);
      return null;
    }
  }
}
