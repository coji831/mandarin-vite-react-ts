/**
 * @file apps/backend/src/modules/word/index.js
 * @description Word module - Public API
 *
 * Simple CRUD module for vocabulary word operations.
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - WordService: Word business logic (CRUD, search, batch operations)
 * - Word: Word domain entity
 *
 * NOT exported: WordRepository, WordController, wordRoutes, IWordRepository
 */

export { WordService } from "./services/WordService.js";
export { Word } from "./domain/Word.js";
