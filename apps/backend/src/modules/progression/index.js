/**
 * @file apps/backend/src/modules/progression/index.js
 * @description Progression module - Public API
 *
 * Tracks foundation section progress and phase gate access.
 * Story 18.1: Foundations Page Structure.
 *
 * Exports:
 * - ProgressionService: Progression business logic
 *
 * NOT exported: ProgressionRepository, ProgressionController, progressionRoutes
 */

export { ProgressionService } from "./services/ProgressionService.js";
