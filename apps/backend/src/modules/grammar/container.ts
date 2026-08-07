/**
 * @file apps/backend/src/modules/grammar/container.ts
 * @description Module-level DI container factory for the Grammar module.
 */
import { GrammarController } from "./api/GrammarController.js";
import { GrammarService } from "./services/GrammarService.js";
import { GrammarRepository } from "./repositories/GrammarRepository.js";

export function createGrammarModule() {
  const repository = new GrammarRepository();
  const service = new GrammarService(repository);
  const controller = new GrammarController(service);
  return { controller };
}
