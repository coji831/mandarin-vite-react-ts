/**
 * @file modules/words/container.ts
 * @description Module-level DI container factory for the Words module.
 */
import { WordsController } from "./api/WordsController.js";
import { WordsService } from "./services/WordsService.js";
import { WordsRepository } from "./repositories/WordsRepository.js";
import { MeasureWordRepository } from "./repositories/MeasureWordRepository.js";
import { MeasureWordService } from "./services/MeasureWordService.js";

export function createWordsModule() {
  const repository = new WordsRepository();
  const service = new WordsService(repository);
  const measureWordRepository = new MeasureWordRepository();
  const measureWordService = new MeasureWordService(measureWordRepository);
  const controller = new WordsController(service, measureWordService);
  return { controller };
}
