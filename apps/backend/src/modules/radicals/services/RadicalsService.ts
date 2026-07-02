/**
 * @file apps/backend/src/modules/radicals/services/RadicalsService.ts
 * @description Business logic for radical reference data
 *
 * Reads from content/radicals/rad_*.json files via shared contentUtils.
 * No Prisma needed — radicals are static reference data.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { readContentFile, readContentFiles } from "../../../shared/utils/contentUtils.js";
import { RadicalsRepository } from "../repositories/RadicalsRepository.js";

const logger = createLogger("RadicalsService");

/**
 * Radical reference data from content files.
 */
interface RadicalData {
  id: string;
  glyph: string;
  meaning: string;
  namePinyin: string;
  strokeCount: number;
  examples: string[];
}

/**
 * Radical progress tracking for a user.
 */
interface RadicalProgressData {
  userId: string;
  radicalId: string;
  memorized: boolean;
  recognitionLevel: number;
  lastReviewed: Date | null;
}

export class RadicalsService {
  private readonly radicalsRepository: RadicalsRepository;

  constructor(radicalsRepository: RadicalsRepository) {
    this.radicalsRepository = radicalsRepository;
  }

  /**
   * Load all radicals from content/radicals/ directory.
   * @returns Array of radical data objects
   */
  async getAllRadicals(): Promise<Record<string, unknown>[]> {
    try {
      const radicals = await readContentFiles("radicals", "rad_");
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
  async getRadicalById(radicalId: string): Promise<Record<string, unknown>> {
    try {
      const radical = await readContentFile("radicals", `${radicalId}.json`);
      return radical;
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
  async getRadicalsByCharacter(glyph: string): Promise<Record<string, unknown>[]> {
    try {
      const records = await this.radicalsRepository.getRadicalsByCharacter(glyph);
      if (records.length === 0) return [];
      // Load each radical's full data from content files
      const radicals = await Promise.all(
        records.map((r) => readContentFile("radicals", `${r.radicalId}.json`)),
      );
      return radicals;
    } catch (err) {
      logger.error(`[RadicalsService] Failed to load radicals for character ${glyph}`, err);
      throw err;
    }
  }
}
