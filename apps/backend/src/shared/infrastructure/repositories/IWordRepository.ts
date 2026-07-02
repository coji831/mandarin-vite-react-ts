/**
 * @file apps/backend/src/shared/infrastructure/repositories/IWordRepository.ts
 * @description Repository interface for word data access
 *
 * Implementations should handle:
 * - Fetching vocabulary words from the database
 * - Searching words by criteria
 * - Batch word lookups
 */

import type { VocabularyWord } from "@prisma/client";

/**
 * Word from a vocabulary list with sort order.
 */
export type WordWithSortOrder = VocabularyWord & { sortOrder: number | null };

/**
 * Word with categories and list info.
 */
export type WordWithDetails = VocabularyWord & {
  categories: Array<{
    category: {
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      displayOrder: number | null;
    };
  }>;
  lists: Array<{ list: { name: string; difficulty: string | null }; sortOrder?: number | null }>;
};

/**
 * Word with category names only.
 */
export type WordWithCategoryNames = VocabularyWord & {
  categories: Array<{ category: { name: string } }>;
};

/**
 * @typedef {Object} WordSearchFilters
 * @property {string[]} [categories] - Filter by category names
 * @property {string[]} [lists] - Filter by list IDs
 * @property {number} [limit=50] - Maximum results
 * @property {number} [offset=0] - Pagination offset
 */

/**
 * @typedef {Object} IWordRepository
 * @property {() => Promise<VocabularyWord[]>} findAll - Get all vocabulary words
 * @property {(id: string) => Promise<WordWithDetails|null>} findById - Find word by ID
 * @property {(listId: string) => Promise<WordWithSortOrder[]>} findByList - Find words belonging to a list
 * @property {(query: string, filters?: WordSearchFilters) => Promise<WordWithCategoryNames[]>} findByIds - Find words by IDs
 * @property {(query: string, filters?: WordSearchFilters) => Promise<WordWithDetails[]>} search - Search words with optional filters
 */
