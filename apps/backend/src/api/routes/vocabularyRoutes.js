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

/**
 * @openapi
 * /api/v1/vocabulary/lists:
 *   get:
 *     summary: Get all vocabulary lists
 *     tags: [Vocabulary]
 *     responses:
 *       200:
 *         description: List of vocabulary lists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VocabularyList'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/api/v1/vocabulary/lists",
  asyncHandler(vocabularyController.listVocabularyLists.bind(vocabularyController)),
);

/**
 * @openapi
 * /api/v1/vocabulary/lists/{listId}:
 *   get:
 *     summary: Get vocabulary list by ID
 *     tags: [Vocabulary]
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary list ID
 *     responses:
 *       200:
 *         description: Vocabulary list details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VocabularyList'
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
router.get(
  "/api/v1/vocabulary/lists/:listId",
  asyncHandler(vocabularyController.getVocabularyList.bind(vocabularyController)),
);

/**
 * @openapi
 * /api/v1/vocabulary/lists/{listId}/words:
 *   get:
 *     summary: Get all words in a vocabulary list
 *     tags: [Vocabulary]
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary list ID
 *     responses:
 *       200:
 *         description: List of vocabulary words
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VocabularyWord'
 *       500:
 *         description: Server error
 */
router.get(
  "/api/v1/vocabulary/lists/:listId/words",
  asyncHandler(vocabularyController.getWordsForList.bind(vocabularyController)),
);

/**
 * @openapi
 * /api/v1/vocabulary/search:
 *   get:
 *     summary: Search vocabulary lists
 *     tags: [Vocabulary]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (matches name and description)
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags to filter by
 *     responses:
 *       200:
 *         description: Filtered vocabulary lists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VocabularyList'
 *       500:
 *         description: Server error
 */
router.get(
  "/api/v1/vocabulary/search",
  asyncHandler(vocabularyController.searchLists.bind(vocabularyController)),
);

/**
 * @openapi
 * /api/v1/vocabulary/lists/{listId}/progress:
 *   get:
 *     summary: Get user progress for a vocabulary list
 *     tags: [Vocabulary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vocabulary list ID
 *     responses:
 *       200:
 *         description: Progress statistics for the list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListProgress'
 *       401:
 *         description: Unauthorized (missing or invalid JWT)
 *       500:
 *         description: Server error
 */
router.get(
  "/api/v1/vocabulary/lists/:listId/progress",
  authenticateToken,
  asyncHandler(vocabularyController.getListProgress.bind(vocabularyController)),
);

export default router;
