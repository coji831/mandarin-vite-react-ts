/**
 * @file apps/backend/src/modules/words/index.ts
 * @description Words module barrel exports.
 */
export { WordsController } from "./api/WordsController.js";
export { WordsService } from "./services/WordsService.js";
export { default as wordsRoutes } from "./api/WordsRoutes.js";
