/**
 * @file apps/backend/src/modules/characters/types/pinyin.ts
 * @description Error class and type re-exports for the Pinyin Search sub-module.
 *
 * Clean Architecture: Domain types (error classes, response shapes).
 */

/**
 * Error thrown when pinyin search validation fails.
 */
export class PinyinValidationError extends Error {
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = "PinyinValidationError";
    this.code = "VALIDATION_ERROR";
  }
}

// Re-export repository types for convenience
export type {
  PinyinSearchParams,
  PinyinSearchResultItem,
  PinyinSearchResponse,
} from "../repositories/PinyinSearchRepository.js";
