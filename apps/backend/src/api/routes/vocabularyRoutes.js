/**
 * @file apps/backend/src/api/routes/vocabularyRoutes.js
 * @description Vocabulary routes with clean architecture DI pattern
 */

import express from "express";
import { VocabularyController } from "../controllers/VocabularyController.js";
import { VocabularyService } from "../../core/services/VocabularyService.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { ProgressService } from "../../core/services/ProgressService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Initialize dependencies (ProgressRepository uses shared Prisma client from models/index.js)
const vocabularyRepository = new VocabularyRepository();
const vocabularyService = new VocabularyService(vocabularyRepository);
const progressRepository = new ProgressRepository();
const progressService = new ProgressService(progressRepository);
const vocabularyController = new VocabularyController(vocabularyService, progressService);

// Public routes (no auth required)
router.get(
  "/api/v1/vocabulary/lists",
  asyncHandler(vocabularyController.listVocabularyLists.bind(vocabularyController)),
);

router.get(
  "/api/v1/vocabulary/lists/:listId",
  asyncHandler(vocabularyController.getVocabularyList.bind(vocabularyController)),
);

router.get(
  "/api/v1/vocabulary/lists/:listId/words",
  asyncHandler(vocabularyController.getWordsForList.bind(vocabularyController)),
);

router.get(
  "/api/v1/vocabulary/search",
  asyncHandler(vocabularyController.searchLists.bind(vocabularyController)),
);

// Protected route (requires auth)
router.get(
  "/api/v1/vocabulary/lists/:listId/progress",
  authenticateToken,
  asyncHandler(vocabularyController.getListProgress.bind(vocabularyController)),
);

export default router;
