/**
 * @file apps/backend/src/modules/progress/index.js
 * @description Progress module - Public API
 *
 * Clean Architecture module for progress tracking, statistics, and streak management.
 *
 * Exports:
 * - ProgressService: Progress CRUD and statistics
 * - StreakService: Study streak tracking and freeze management
 *
 * NOT exported: repositories, controllers, routes, entities (internal)
 */

export { ProgressService } from "./use-cases/ProgressService.js";
export { StreakService } from "./use-cases/StreakService.js";
