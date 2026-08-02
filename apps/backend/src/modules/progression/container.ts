/**
 * @file modules/progression/container.ts
 * @description Module-level DI container factory for the Progression module.
 */
import { ProgressionService } from "./services/ProgressionService.js";
import { ProgressionController } from "./api/ProgressionController.js";
import { ProgressionRepository } from "./repositories/ProgressionRepository.js";
import type { ReviewService } from "../review/services/ReviewService.js";
import type { ReadersService } from "../readers/services/ReadersService.js";
import type { QuizService } from "../quiz/services/QuizService.js";

export interface ProgressionModuleDeps {
  progressionRepository: ProgressionRepository;
  reviewService: ReviewService;
  readersService: ReadersService;
  quizService: QuizService;
}

export function createProgressionModule(deps: ProgressionModuleDeps) {
  const service = new ProgressionService(
    deps.progressionRepository,
    deps.readersService,
    deps.quizService,
  );
  const controller = new ProgressionController(service, deps.reviewService);
  return { controller, service };
}
