/**
 * @file modules/review/container.ts
 * @description Module-level DI container factory for the Review module.
 */
import { ReviewRepository } from "./repositories/ReviewRepository.js";
import { ReviewService } from "./services/ReviewService.js";
import { ReviewController } from "./api/ReviewController.js";

export interface ReviewModuleDeps {
  reviewRepository: ReviewRepository;
}

export function createReviewModule(deps: ReviewModuleDeps) {
  const service = new ReviewService(deps.reviewRepository);
  const controller = new ReviewController(service);
  return { controller, service };
}
