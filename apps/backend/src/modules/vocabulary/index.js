/**
 * @file apps/backend/src/modules/vocabulary/index.js
 * @description Vocabulary module — public API
 *
 * Exports only what other modules are allowed to consume.
 * Internals (controllers, repositories, routes) are not exported.
 */

export { VocabularyService } from "./services/VocabularyService.js";
export { VocabularyListService } from "./services/VocabularyListService.js";
