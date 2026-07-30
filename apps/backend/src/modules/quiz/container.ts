/**
 * @file modules/quiz/container.ts
 * @description Module-level DI container factory for the Quiz module.
 */
import { QuizRepository } from "./repositories/QuizRepository.js";
import { QuizService } from "./services/QuizService.js";
import { QuizController } from "./api/QuizController.js";
import type { ProgressionService } from "../progression/services/ProgressionService.js";

export interface QuizModuleDeps {
  quizRepository: QuizRepository;
  progressionService: ProgressionService;
}

export function createQuizModule(deps: QuizModuleDeps) {
  const service = new QuizService(deps.quizRepository, deps.progressionService);
  const controller = new QuizController(service);
  return { controller, service };
}
