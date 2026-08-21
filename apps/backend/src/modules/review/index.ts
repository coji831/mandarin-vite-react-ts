/**
 * @file apps/backend/src/modules/review/index.ts
 * @description Review module barrel exports (framework-agnostic surface only
 * — the Express HTTP layer was removed at the 24-15 cutover).
 */
export { ReviewService } from "./services/ReviewService.js";
export { ReviewRepository } from "./repositories/ReviewRepository.js";
