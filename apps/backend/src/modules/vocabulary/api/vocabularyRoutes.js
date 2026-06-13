/**
 * @file apps/backend/src/modules/vocabulary/api/vocabularyRoutes.js
 * @description Vocabulary routes with clean architecture DI pattern
 */

import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { vocabularyController } from "../../../app/container.js";

const router = express.Router();

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1vocabulary~1lists
router.get(
  `${ROUTE_PATTERNS.vocabulary}/lists`,
  asyncHandler(vocabularyController.listVocabularyLists.bind(vocabularyController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1vocabulary~1lists~1{listId}
router.get(
  `${ROUTE_PATTERNS.vocabulary}/lists/:listId`,
  asyncHandler(vocabularyController.getVocabularyList.bind(vocabularyController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1vocabulary~1lists~1{listId}~1words
router.get(
  `${ROUTE_PATTERNS.vocabulary}/lists/:listId/words`,
  asyncHandler(vocabularyController.getWordsForList.bind(vocabularyController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1vocabulary~1search
router.get(
  `${ROUTE_PATTERNS.vocabulary}/search`,
  asyncHandler(vocabularyController.searchLists.bind(vocabularyController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1vocabulary~1lists~1{listId}~1progress
router.get(
  `${ROUTE_PATTERNS.vocabulary}/lists/:listId/progress`,
  authenticateToken,
  asyncHandler(vocabularyController.getListProgress.bind(vocabularyController)),
);

export default router;
