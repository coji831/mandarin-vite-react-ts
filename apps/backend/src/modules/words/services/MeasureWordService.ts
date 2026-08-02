/**
 * @file apps/backend/src/modules/words/services/MeasureWordService.ts
 * @description Service for measure word (量词) lookup by word ID.
 *
 * Clean Architecture: Application Service / Use Case.
 * Queries MeasureWordWord joined with MeasureWord for a given word.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { WordIdNotFoundError } from "../types/words-errors.js";
import { MeasureWordRepository } from "../repositories/MeasureWordRepository.js";

const logger = createLogger("MeasureWordService");

/**
 * A measure word associated with a noun word.
 */
export interface MeasureWordEntry {
  id: string;
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  category: string | null;
  usageNote: string | null;
  isDefault: boolean;
  exampleSentence: string | null;
}

/**
 * Result shape for getMeasureWordsForWord.
 */
export interface MeasureWordsForWordResult {
  wordId: string;
  simplified: string | null;
  measureWords: MeasureWordEntry[];
}

/**
 * Service for measure word business logic.
 */
export class MeasureWordService {
  constructor(private repository: MeasureWordRepository) {}

  /**
   * Fetch measure words associated with a given word ID.
   *
   * @param wordId - The word ID (e.g., "w_00284")
   * @returns The word info with its associated measure words
   * @throws WordIdNotFoundError if the word ID does not exist
   */
  async getMeasureWordsForWord(wordId: string): Promise<MeasureWordsForWordResult> {
    // 1. Verify the word exists
    const word = await this.repository.findWordById(wordId);

    if (!word) {
      throw new WordIdNotFoundError(wordId);
    }

    // 2. Query MeasureWordWord joined with MeasureWord where wordId matches
    const mwwRecords = await this.repository.findMeasureWordsForWord(wordId);

    // 3. Map to return shape
    const measureWords: MeasureWordEntry[] = mwwRecords.map((record) => ({
      id: record.measureWord.id,
      simplified: record.measureWord.simplified,
      pinyin: record.measureWord.pinyin,
      meaning: record.measureWord.meaning,
      category: record.measureWord.category,
      usageNote: record.measureWord.usageNote,
      isDefault: record.isDefault,
      exampleSentence: record.exampleSentence,
    }));

    logger.info(
      `Found ${measureWords.length} measure words for word ${wordId} (${word.simplified})`,
    );

    return {
      wordId: word.id,
      simplified: word.simplified,
      measureWords,
    };
  }
}
