/**
 * @file modules/progression/container.ts
 * @description Module-level DI container factory for the Progression module.
 */
import { ProgressionService } from "./services/ProgressionService.js";
import { ProgressionController } from "./api/ProgressionController.js";
import { ProgressionRepository } from "./repositories/ProgressionRepository.js";
import type { ReviewService } from "../review/services/ReviewService.js";

export interface ProgressionModuleDeps {
  progressionRepository: ProgressionRepository;
  reviewService: ReviewService;
}

export function createProgressionModule(deps: ProgressionModuleDeps) {
  const service = new ProgressionService(deps.progressionRepository);
  const controller = new ProgressionController(service, deps.reviewService);
  return { controller, service };
}
