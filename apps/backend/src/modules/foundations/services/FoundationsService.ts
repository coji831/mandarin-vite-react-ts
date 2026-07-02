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
import { readContentFiles, readContentFile } from "../../../shared/utils/contentUtils.js";
import type { ContentFile } from "../../../shared/utils/contentUtils.js";
import type {
  ComboPair,
  PinyinComboRow,
  PinyinTonesPool,
  StrokesReference,
} from "../types/foundations.js";

const logger = createLogger("FoundationsService");

/**
 * Group PinyinCombination records by initial+final pair into 5-slot tone arrays.
 * @param combinations - Raw records from PinyinCombination table
 * @returns Pool-shaped combo objects with tones[5] arrays
 */
function groupCombosByPair(combinations: PinyinComboRow[]): ComboPair[] {
  const comboMap = new Map<string, { initial: string; final: string; tones: (string | null)[] }>();
  for (const c of combinations) {
    const key = `${c.initialId}-${c.finalId}`;
    if (!comboMap.has(key)) {
      comboMap.set(key, { initial: c.initialId, final: c.finalId, tones: [] });
    }
    const entry = comboMap.get(key)!;
    const toneIdx = c.tone === 0 ? 4 : c.tone - 1;
    entry.tones[toneIdx] = c.syllable;
  }
  return Array.from(comboMap.values()).map((c) => ({
    initial: c.initial.replace("init_", ""),
    final: c.final.replace("fin_", ""),
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
      const [initials, finals, toneInfo, toneReference] = await Promise.all([
        readContentFiles("pinyin", "init_"),
        readContentFiles("pinyin", "fin_"),
        readContentFiles("tones", "tn_"),
        readContentFile("references", "tone-reference.json"),
      ]);

      // Read all combinations from PinyinCombination (Prisma junction table)
      const combinations = await prisma.pinyinCombination.findMany();

      // Group by initial+final for the pool shape (5-slot tone array per combo)
      const combined = groupCombosByPair(combinations);

      return {
        initials: initials.map((i: ContentFile) => ({
          id: i.pinyin!,
          pinyin: i.pinyin!,
          ipa: i.ipa || null,
          description:
            (i.metadata as { pronunciation_guide?: string } | undefined)?.pronunciation_guide ||
            i.description ||
            "",
        })),
        finals: finals.map((f: ContentFile) => ({
          id: f.pinyin!,
          pinyin: f.pinyin!,
          type: f.category === "simple" || f.category === "simple_final" ? "simple" : "compound",
          description:
            (f.metadata as { pronunciation_guide?: string } | undefined)?.pronunciation_guide || "",
        })),
        combinations: combined,
        toneInfo: toneInfo.map((t: ContentFile) => ({
          number: t.number!,
          name: t.name!,
          mark: t.mark!,
          pinyinExample: t.example_syllable!,
          chineseExample: t.example_character!,
          description: t.pitch_description!,
          contour: t.contour || null,
          color: t.color!,
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
   * Get a pinyin-to-character mapping from PinyinCombination.
   * @returns Map of syllable -> character
   */
  async getPinyinCharacterMap(): Promise<Record<string, string | null>> {
    const combos = await prisma.pinyinCombination.findMany({
      where: { character: { not: null } },
      select: { syllable: true, character: true },
    });
    const map: Record<string, string | null> = {};
    for (const combo of combos) {
      if (!map[combo.syllable]) {
        map[combo.syllable] = combo.character;
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
}
