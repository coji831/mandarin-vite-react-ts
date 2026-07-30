/**
 * @file apps/backend/src/modules/radicals/services/RadicalsService.ts
 * @description Business logic for radical reference data
 *
 * Reads from content/radicals/radicals.json aggregate file via shared contentUtils.
 * No Prisma needed — radicals are static reference data.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import {
  readAggregateContent,
  findInAggregateContent,
} from "../../../shared/utils/contentUtils.js";
import { RadicalsRepository } from "../repositories/RadicalsRepository.js";

const logger = createLogger("RadicalsService");

/**
 * Radical item shape from the aggregate content file (camelCase fields).
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
  hskCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
}

export class RadicalsService {
  private readonly radicalsRepository: RadicalsRepository;

  constructor(radicalsRepository: RadicalsRepository) {
    this.radicalsRepository = radicalsRepository;
  }

  /**
   * Load all radicals from content/radicals/radicals.json aggregate.
   * @returns Array of radical data objects
   */
  async getAllRadicals(): Promise<RadicalItem[]> {
    try {
      const radicals = await readAggregateContent<RadicalItem>("radicals", "radicals.json");
      return radicals;
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
      const radical = await findInAggregateContent<RadicalItem>(
        "radicals",
        "radicals.json",
        "id",
        radicalId,
      );
      return radical ?? null;
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
      // Load each radical's full data from the aggregate
      const allRadicals = await readAggregateContent<RadicalItem>("radicals", "radicals.json");
      const radicalMap = new Map(allRadicals.map((r) => [r.id, r]));
      return records
        .map((r) => radicalMap.get(r.radicalId))
        .filter((r): r is RadicalItem => r !== undefined);
    } catch (err) {
      logger.error(`[RadicalsService] Failed to load radicals for character ${glyph}`, err);
      throw err;
    }
  }
}
