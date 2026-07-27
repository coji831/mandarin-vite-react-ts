/**
 * @file apps/backend/src/shared/infrastructure/repositories/IWordRepository.ts
 * @description Repository interface for word data access
 *
 * Implementations should handle:
 * - Fetching words from the database
 * - Searching words by criteria
 * - Batch word lookups
 */

import type { Word } from "@prisma/client";

/**
 * Word with HSK level info.
 */
export type WordWithDetails = Word & {
  wordHskLevels: Array<{
    hskLevel: number;
    hskVersion: string | null;
  }>;
};

/**
 * Word with HSK level info only (lightweight).
 */
export type WordWithCategoryNames = Word & {
  wordHskLevels: Array<{ hskLevel: number }>;
};

/**
 * @typedef {Object} WordSearchFilters
 * @property {number} [hskLevel] - Filter by HSK level
 * @property {number} [limit=50] - Maximum results
 * @property {number} [offset=0] - Pagination offset
 */

/**
 * @typedef {Object} IWordRepository
 * @property {() => Promise<Word[]>} findAll - Get all words
 * @property {(id: string) => Promise<WordWithDetails|null>} findById - Find word by ID
 * @property {(ids: string[]) => Promise<WordWithCategoryNames[]>} findByIds - Find words by IDs
 * @property {(query: string, filters?: WordSearchFilters) => Promise<WordWithDetails[]>} search - Search words with optional filters
 * @property {(learnedWordIds: string[], limit?: number) => Promise<Word[]>} findUnlearnedWords - Find unlearned words
 */
