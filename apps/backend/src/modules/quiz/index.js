/**
 * @file apps/backend/src/modules/quiz/index.js
 * @description Quiz module - Public API
 *
 * Clean Architecture module for quiz session management, spaced repetition,
 * progress tracking, and streak management.
 *
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - QuizSessionOrchestrator: Quiz session lifecycle orchestrator
 * - ProgressService: Progress CRUD and statistics
 *
 * NOT exported: repositories, controllers, routes, entities, use-cases (internal)
 */

export { QuizSessionOrchestrator } from "./use-cases/QuizSessionOrchestrator.js";
export { ProgressService } from "./use-cases/ProgressService.js";
