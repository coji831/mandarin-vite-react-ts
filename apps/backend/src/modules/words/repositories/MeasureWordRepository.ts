/**
 * @file apps/backend/src/modules/words/repositories/MeasureWordRepository.ts
 * @description Repository for measure word Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

/**
 * Repository for measure word database queries.
 */
export class MeasureWordRepository {
  /**
   * Find a word by its ID.
   *
   * @param wordId - The word ID (e.g., "w_00284")
   * @returns The word record with id and simplified, or null if not found
   */
  async findWordById(wordId: string) {
    return prisma.word.findUnique({
      where: { id: wordId },
      select: { id: true, simplified: true },
    });
  }

  /**
   * Find measure words associated with a given word ID.
   *
   * @param wordId - The word ID
   * @returns Array of measure word records with included measure word details
   */
  async findMeasureWordsForWord(wordId: string) {
    return prisma.measureWordWord.findMany({
      where: { wordId },
      include: {
        measureWord: {
          select: {
            id: true,
            simplified: true,
            pinyin: true,
            meaning: true,
            category: true,
            usageNote: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { measureWord: { simplified: "asc" } }],
    });
  }
}
