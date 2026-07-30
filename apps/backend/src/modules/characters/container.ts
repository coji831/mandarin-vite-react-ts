/**
 * @file apps/backend/src/modules/characters/container.ts
 * @description Module-level DI container factory for the Characters module.
 */
import { CharactersController } from "./api/CharactersController.js";
import { CharactersService } from "./services/CharactersService.js";
import { CharactersRepository } from "./repositories/CharactersRepository.js";
import { PinyinController } from "./api/PinyinController.js";
import { PinyinSearchService } from "./services/PinyinSearchService.js";
import { PinyinSearchRepository } from "./repositories/PinyinSearchRepository.js";

export function createCharactersModule() {
  const repository = new CharactersRepository();
  const service = new CharactersService(repository);
  const controller = new CharactersController(service);
  return { controller };
}

export function createPinyinModule() {
  const repository = new PinyinSearchRepository();
  const service = new PinyinSearchService(repository);
  const controller = new PinyinController(service);
  return { controller };
}
