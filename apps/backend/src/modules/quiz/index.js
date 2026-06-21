/**
 * @file apps/backend/src/modules/quiz/index.js
 * @description Quiz module - Public API
 *
 * Clean Architecture module for quiz session management and spaced repetition.
 *
 * Exports only what other modules or container.js can consume.
 *
 * Exports:
 * - QuizController: Generic HTTP controller for quiz endpoints
 * - QuizService: Generic quiz service with strategy delegation
 * - QuizRepository: Prisma-based data access for quiz attempts
 * - getStrategy / getRegisteredTypes: Strategy registry helpers
 * - quizRoutes: Generic quiz routes
 *
 * NOT exported: repositories (internal), entities (internal), use-cases (internal)
 */

export { QuizController } from "./api/QuizController.js";
export { QuizService } from "./services/QuizService.js";
export { QuizRepository } from "./repositories/QuizRepository.js";
export { getStrategy, getRegisteredTypes } from "./strategies/index.js";
export { default as quizRoutes } from "./api/quizRoutes.js";
