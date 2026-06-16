/**
 * @file apps/backend/src/modules/quiz/index.js
 * @description Quiz module - Public API
 *
 * Clean Architecture module for quiz session management and spaced repetition.
 *
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - QuizSessionOrchestrator: Quiz session lifecycle orchestrator
 *
 * NOT exported: repositories, controllers, routes, entities, use-cases (internal)
 */

export { QuizSessionOrchestrator } from "./use-cases/QuizSessionOrchestrator.js";
