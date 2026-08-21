/**
 * @file apps/backend/src/modules/progression/index.ts
 * @description Progression module barrel exports (framework-agnostic surface
 * only — the Express HTTP layer was removed at the 24-15 cutover).
 *
 * Exports:
 * - ProgressionService: Progression business logic
 * - ProgressionRepository: Prisma-based data access
 */

export { ProgressionService } from "./services/ProgressionService.js";
export { ProgressionRepository } from "./repositories/ProgressionRepository.js";
