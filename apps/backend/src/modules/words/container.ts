/**
 * @file modules/words/container.ts
 * @description Module-level DI container factory for the Words module.
 */
import { WordsController } from "./api/WordsController.js";
import { WordsService } from "./services/WordsService.js";
import { WordsRepository } from "./repositories/WordsRepository.js";

export function createWordsModule() {
  const repository = new WordsRepository();
  const service = new WordsService(repository);
  const controller = new WordsController(service);
  return { controller };
}
