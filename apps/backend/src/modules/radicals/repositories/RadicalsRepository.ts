/**
 * @file apps/backend/src/modules/radicals/repositories/RadicalsRepository.ts
 * @description Repository for radical-related Prisma queries.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";

export class RadicalsRepository {
  async getRadicalsByCharacter(
    character: string,
  ): Promise<{ characterGlyph: string; radicalId: string }[]> {
    return await prisma.characterRadical.findMany({ where: { characterGlyph: character } });
  }
}
