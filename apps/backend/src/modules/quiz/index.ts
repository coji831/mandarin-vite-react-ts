/**
 * @file apps/backend/src/modules/quiz/index.ts
 * @description Quiz module barrel exports (framework-agnostic surface only —
 * the Express HTTP layer was removed at the 24-15 cutover).
 *
 * Exports:
 * - QuizService: Generic quiz service with strategy delegation
 * - QuizRepository: Prisma-based data access for quiz attempts
 * - getStrategy / getRegisteredTypes: Strategy registry helpers
 */

export { QuizService } from "./services/QuizService.js";
export { QuizRepository } from "./repositories/QuizRepository.js";
export { getStrategy, getRegisteredTypes } from "./strategies/index.js";
