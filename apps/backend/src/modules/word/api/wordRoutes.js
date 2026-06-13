/**
 * @file apps/backend/src/modules/word/api/wordRoutes.js
 * @description Word routes with clean architecture DI pattern
 */

import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { wordController } from "../../../app/container.js";

const router = express.Router();

/**
 * GET /api/v1/words/:id
 * Get a word by its ID
 */
router.get(
  `${ROUTE_PATTERNS.vocabulary}/words/:id`,
  asyncHandler(wordController.getWord.bind(wordController)),
);

/**
 * GET /api/v1/words/search?q=...
 * Search words with optional filters
 */
router.get(
  `${ROUTE_PATTERNS.vocabulary}/words/search`,
  asyncHandler(wordController.searchWords.bind(wordController)),
);

export default router;
