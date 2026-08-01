/**
 * @file apps/backend/src/modules/radicals/services/RadicalsService.ts
 * @description Business logic for radical reference data
 *
 * Reads from the Radical table (Prisma) via RadicalsRepository — all-in-DB.
 * The frontend RadicalItem contract is unchanged.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { RadicalsRepository, type RadicalRow } from "../repositories/RadicalsRepository.js";

const logger = createLogger("RadicalsService");

/**
 * Radical item shape returned to the frontend (camelCase fields).
 * Matches the legacy aggregate-file shape — frontend contract unchanged.
 */
interface RadicalItem {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  namePinyin: string;
  nameChinese: string;
  meaning: string;
  strokeCount: number;
  isRecommended: boolean;
  kangxiIndex: number;
  etymology: string;
  frequencyRank: number | null;
  notes: string | null;
  isAlsoCharacter: boolean | null;
  variants: Record<string, unknown> | null;
  // Legacy field: radicals.json never carried HSK characters; kept for
  // contract stability (the HSK-character relationship is derived from the
  // CharacterRadical junction at the quiz layer instead).
  hskCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

/** Map a DB Radical row to the frontend RadicalItem shape. */
function toRadicalItem(r: RadicalRow): RadicalItem {
  return {
    id: r.id,
    glyph: r.glyph,
    alternateGlyphs: r.alternateGlyphs,
    namePinyin: r.namePinyin,
    nameChinese: r.nameChinese ?? "",
    meaning: r.meaning,
    strokeCount: r.strokeCount,
    isRecommended: r.isRecommended,
    kangxiIndex: r.kangxiIndex ?? 0,
    etymology: r.etymology ?? "",
    frequencyRank: r.frequencyRank,
    notes: r.notes,
    isAlsoCharacter: r.isAlsoCharacter,
    variants: (r.variants as Record<string, unknown> | null) ?? null,
    hskCharacters: [],
  };
}

export class RadicalsService {
  private readonly radicalsRepository: RadicalsRepository;

  constructor(radicalsRepository: RadicalsRepository) {
    this.radicalsRepository = radicalsRepository;
  }

  /**
   * Load all radicals from the Radical table.
   * @returns Array of radical data objects
   */
  async getAllRadicals(): Promise<RadicalItem[]> {
    try {
      const radicals = await this.radicalsRepository.getAllRadicals();
      return radicals.map(toRadicalItem);
    } catch (err) {
      logger.error("[RadicalsService] Failed to load radicals", err);
      throw err;
    }
  }

  /**
   * Load a single radical by ID (e.g. "rad_0001").
   * @param radicalId
   * @returns Radical data
   */
  async getRadicalById(radicalId: string): Promise<RadicalItem | null> {
    try {
      const radical = await this.radicalsRepository.getRadicalById(radicalId);
      return radical ? toRadicalItem(radical) : null;
    } catch (err) {
      logger.error(`[RadicalsService] Failed to load radical ${radicalId}`, err);
      throw err;
    }
  }

  /**
   * Get radicals for a specific character glyph.
   * @param glyph - The character glyph (e.g. "路")
   * @returns Array of radical data objects
   */
  async getRadicalsByCharacter(glyph: string): Promise<RadicalItem[]> {
    try {
      const records = await this.radicalsRepository.getRadicalsByCharacter(glyph);
      if (records.length === 0) return [];
      // Load each referenced radical's full data from the Radical table
      const radicalRows = await this.radicalsRepository.findManyByIds(
        records.map((r) => r.radicalId),
      );
      const radicalMap = new Map(radicalRows.map((r) => [r.id, r]));
      return records
        .map((r) => radicalMap.get(r.radicalId))
        .filter((r): r is RadicalRow => r !== undefined)
        .map(toRadicalItem);
    } catch (err) {
      logger.error(`[RadicalsService] Failed to load radicals for character ${glyph}`, err);
      throw err;
    }
  }
}
