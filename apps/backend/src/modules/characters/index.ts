/**
 * @file apps/backend/src/modules/characters/index.ts
 * @description Characters module barrel exports.
 */
export { CharactersController } from "./api/CharactersController.js";
export { CharactersService } from "./services/CharactersService.js";
export { CharactersRepository } from "./repositories/CharactersRepository.js";
export { default as charactersRoutes } from "./api/charactersRoutes.js";
export { PinyinController } from "./api/PinyinController.js";
export { PinyinSearchService } from "./services/PinyinSearchService.js";
export { PinyinSearchRepository } from "./repositories/PinyinSearchRepository.js";
export { PinyinValidationError } from "./types/pinyin.js";
export { default as pinyinRoutes } from "./api/pinyinRoutes.js";
