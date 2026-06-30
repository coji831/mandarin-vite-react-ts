/**
 * @file apps/backend/src/modules/radicals/services/RadicalsService.js
 * @description Business logic for radical reference data
 *
 * Reads from content/radicals/rad_*.json files via shared contentUtils.
 * No Prisma needed — radicals are static reference data.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import { readContentFile, readContentFiles } from "../../../shared/utils/contentUtils.js";
import { prisma } from "../../../shared/infrastructure/database/client.js";

const logger = createLogger("RadicalsService");

export class RadicalsService {
  /**
   * Load all radicals from content/radicals/ directory.
   * @returns {Promise<Object[]>} Array of radical data objects
   */
  async getAllRadicals() {
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
   * @param {string} radicalId
   * @returns {Promise<Object>} Radical data
   */
  async getRadicalById(radicalId) {
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
   * @param {string} glyph - The character glyph (e.g. "路")
   * @returns {Promise<Object[]>} Array of radical data objects
   */
  async getRadicalsByCharacter(glyph) {
    try {
      const records = await prisma.characterRadical.findMany({
        where: { characterGlyph: glyph },
      });
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
