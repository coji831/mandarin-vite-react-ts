/**
 * @file apps/backend/src/modules/radicals/repositories/RadicalsRepository.ts
 * @description Repository for radical-related Prisma queries.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";

/** Radical reference row (Radical table — seeded, all-in-DB). */
export interface RadicalRow {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  namePinyin: string;
  nameChinese: string | null;
  meaning: string;
  strokeCount: number;
  isRecommended: boolean;
  kangxiIndex: number | null;
  etymology: string | null;
  frequencyRank: number | null;
  notes: string | null;
  isAlsoCharacter: boolean | null;
  variants: unknown;
}

export class RadicalsRepository {
  /** All radicals ordered by Kangxi index (matches the legacy aggregate order). */
  async getAllRadicals(): Promise<RadicalRow[]> {
    return prisma.radical.findMany({ orderBy: { kangxiIndex: "asc" } });
  }

  /** Fetch a single radical by business-key ID (e.g. "rad_0001"). */
  async getRadicalById(id: string): Promise<RadicalRow | null> {
    return prisma.radical.findUnique({ where: { id } });
  }

  /** Fetch radicals by a list of business-key IDs. */
  async findManyByIds(ids: string[]): Promise<RadicalRow[]> {
    if (ids.length === 0) return [];
    return prisma.radical.findMany({ where: { id: { in: ids } } });
  }

  async getRadicalsByCharacter(
    character: string,
  ): Promise<{ characterGlyph: string; radicalId: string }[]> {
    return await prisma.characterRadical.findMany({ where: { characterGlyph: character } });
  }
}
