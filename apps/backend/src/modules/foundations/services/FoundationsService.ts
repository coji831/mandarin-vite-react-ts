/**
 * @file apps/backend/src/modules/foundations/services/FoundationsService.ts
 * @description Business logic for foundations reference data
 *
 * Data sources (Content Registry):
 *   - getPinyinTonesPool: content files (content/pinyin/ + content/tones/) + PinyinCombination (Prisma)
 *   - getPinyinCharacterMap: PinyinCombination (Prisma junction table)
 *   - getStrokesReference: content/references/strokes.json
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";
import { readAggregateContent, readContentFile } from "../../../shared/utils/contentUtils.js";
import type { ContentFile } from "../../../shared/utils/contentUtils.js";
import type {
  ComboPair,
  PinyinComboRow,
  PinyinTonesPool,
  StrokesReference,
  CharacterDetailResponse,
  CharacterReading,
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
   * Build the full PinyinTonesPool from content files + PinyinCombination.
   * Content files provide entity attributes; PinyinCombination provides init×fin×tone mappings.
   * Tone pairs and tone rules come from a static reference file.
   * @returns Pool-shaped object matching the legacy format
   */
  async getPinyinTonesPool(): Promise<PinyinTonesPool> {
    try {
      const [allPinyin, toneInfo, toneReference] = await Promise.all([
        readAggregateContent<ContentFile>("pinyin", "pinyin.json"),
        readAggregateContent<ContentFile>("tones", "tones.json"),
        readContentFile("references", "tone-reference.json"),
      ]);

      // Filter by phoneme type — pinyin.json aggregate uses phonemeType field
      const initials = allPinyin.filter((p) => p.phonemeType === "initial");
      const finals = allPinyin.filter((p) => p.phonemeType === "final");

      // Read all syllables from PinyinSyllable (replaces deprecated PinyinCombination)
      const syllables = await prisma.pinyinSyllable.findMany();

      // Group by initial+final for the pool shape (5-slot tone array per combo)
      const combined = groupCombosByPair(syllables);

      return {
        initials: initials.map((i: ContentFile) => ({
          id: i.pinyin!,
          pinyin: i.pinyin!,
          ipa: i.ipa || null,
          description: (i.pronunciationGuide as string) || i.description || "",
        })),
        finals: finals.map((f: ContentFile) => ({
          id: f.pinyin!,
          pinyin: f.pinyin!,
          type:
            (f.type as string) === "simple" || (f.type as string) === "simple_final"
              ? "simple"
              : "compound",
          description: (f.pronunciationGuide as string) || "",
        })),
        combinations: combined,
        toneInfo: toneInfo.map((t: ContentFile) => ({
          number: t.number!,
          name: t.name!,
          mark: t.mark || "",
          pinyinExample: (t.exampleSyllable as string) || "",
          chineseExample: (t.exampleCharacter as string) || "",
          description: (t.pitchDescription as string) || "",
          contour: t.contour || null,
          color: t.color || "",
        })),
        tonePairs: (toneReference.tonePairs as unknown[]) || [],
        toneRules: (toneReference.toneRules as unknown[]) || [],
      };
    } catch (err) {
      logger.error("[FoundationsService] Failed to build pinyin-tones pool", err);
      throw err;
    }
  }

  /**
   * Get a pinyin-to-character mapping from PinyinCharacterMapping.
   * @returns Map of syllable -> character
   */
  async getPinyinCharacterMap(): Promise<Record<string, string | null>> {
    const mappings = await prisma.pinyinCharacterMapping.findMany({
      include: {
        pinyinSyllable: { select: { syllablePretty: true } },
        character: { select: { glyph: true } },
      },
    });
    const map: Record<string, string | null> = {};
    for (const mapping of mappings) {
      const syl = mapping.pinyinSyllable.syllablePretty;
      if (syl && !map[syl]) {
        map[syl] = mapping.character.glyph;
      }
    }
    return map;
  }

  /**
   * Get the strokes reference data.
   * @returns Strokes data (strokes, strokeOrderRules, suggestedCharacters)
   */
  async getStrokesReference(): Promise<StrokesReference> {
    try {
      const data = await readContentFile("references", "strokes.json");
      return data as StrokesReference;
    } catch (err) {
      logger.error("[FoundationsService] Failed to load strokes reference", err);
      throw err;
    }
  }

  /**
   * Get character detail data by glyph.
   * Reads from the Character table (Prisma) first, falls back to scanning
   * content/characters/ JSON files for backward compatibility.
   * @param glyph - The Chinese character glyph (e.g. "好")
   * @returns Character detail or null if not found
   */
  async getCharacterByGlyph(glyph: string): Promise<CharacterDetailResponse | null> {
    try {
      // Try Prisma Character table first
      const character = await prisma.character.findUnique({
        where: { glyph },
      });

      if (character) {
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
      }

      // Fallback: scan aggregate characters file
      const characters = await readAggregateContent("characters", "characters.json");
      const match = characters.find((c: ContentFile) => c.glyph === glyph);
      if (!match) return null;

      const readings: CharacterReading[] = (match.readings || []).map(
        (r: Record<string, unknown>) => ({
          pinyin: r.pinyin as string,
          tone: r.tone as number,
          type: r.type as string,
          core_meaning: r.core_meaning as string,
        }),
      );

      const meta = (match.metadata || {}) as Record<string, unknown>;

      return {
        glyph: match.glyph as string,
        traditional: (match.traditional as string) || (match.glyph as string),
        strokeCount: match.stroke_count as number,
        hskLevel: match.hsk_level as number,
        readings,
        etymology: (meta.etymology as string) || undefined,
        frequencyRank: (meta.frequency_rank as number) || undefined,
        commonWords: (meta.common_words as string[]) || undefined,
        radicalIds: (meta.radical_ids as string[]) || undefined,
        definition: readings[0]?.core_meaning || undefined,
      };
    } catch (err) {
      logger.error(`[FoundationsService] Failed to get character "${glyph}"`, err);
      return null;
    }
  }
}
