/**
 * @file apps/backend/src/modules/characters/index.ts
 * @description Characters module barrel exports.
 */
export { CharactersController } from "./api/CharactersController.js";
export { CharactersService } from "./services/CharactersService.js";
export { CharactersRepository } from "./repositories/CharactersRepository.js";
export { default as charactersRoutes } from "./api/charactersRoutes.js";
