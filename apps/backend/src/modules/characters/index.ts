/**
 * @file apps/backend/src/modules/characters/index.ts
 * @description Characters module barrel exports (framework-agnostic surface
 * only).
 */
export { CharactersService } from "./services/CharactersService.js";
export { CharactersRepository } from "./repositories/CharactersRepository.js";
export { PinyinSearchService } from "./services/PinyinSearchService.js";
export { PinyinSearchRepository } from "./repositories/PinyinSearchRepository.js";
export { PinyinValidationError } from "./types/pinyin.js";
