/**
 * @file apps/backend/src/modules/characters/container.ts
 * @description Module-level DI container factory for the Characters module.
 */
import { CharactersController } from "./api/CharactersController.js";
import { CharactersService } from "./services/CharactersService.js";
import { CharactersRepository } from "./repositories/CharactersRepository.js";

export function createCharactersModule() {
  const repository = new CharactersRepository();
  const service = new CharactersService(repository);
  const controller = new CharactersController(service);
  return { controller };
}
