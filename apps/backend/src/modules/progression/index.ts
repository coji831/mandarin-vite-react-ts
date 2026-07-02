/**
 * @file apps/backend/src/modules/progression/index.js
 * @description Progression module - Public API
 *
 * Tracks foundation section progress and phase gate access.
 * Story 18.1: Foundations Page Structure.
 *
 * Exports:
 * - ProgressionController: HTTP controller for progression endpoints
 * - ProgressionService: Progression business logic
 * - ProgressionRepository: Prisma-based data access
 * - progressionRoutes: Express router for progression endpoints
 */

export { ProgressionController } from "./api/ProgressionController.js";
export { ProgressionService } from "./services/ProgressionService.js";
export { ProgressionRepository } from "./repositories/ProgressionRepository.js";
export { default as progressionRoutes } from "./api/progressionRoutes.js";
