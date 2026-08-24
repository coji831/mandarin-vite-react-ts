/**
 * @file apps/backend/src/modules/progression/index.ts
 * @description Progression module barrel exports (framework-agnostic surface
 * only).
 *
 * Exports:
 * - ProgressionService: Progression business logic
 * - ProgressionRepository: Prisma-based data access
 */

export { ProgressionService } from "./services/ProgressionService.js";
export { ProgressionRepository } from "./repositories/ProgressionRepository.js";
