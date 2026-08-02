/**
 * @file modules/radicals/container.ts
 * @description Module-level DI container factory for the Radicals module.
 */
import { RadicalsController } from "./api/RadicalsController.js";
import { RadicalsService } from "./services/RadicalsService.js";
import { RadicalsRepository } from "./repositories/RadicalsRepository.js";
import { RadicalCharacterService } from "./services/RadicalCharacterService.js";

export function createRadicalsModule() {
  const repository = new RadicalsRepository();
  const service = new RadicalsService(repository);
  const radicalCharacterService = new RadicalCharacterService();
  const controller = new RadicalsController(service, radicalCharacterService);
  return { controller };
}
