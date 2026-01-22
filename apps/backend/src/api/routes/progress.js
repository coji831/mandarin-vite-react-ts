/**
 * @file apps/backend/src/api/routes/progress.js
 * @description Progress tracking routes (mounted under /api in index.js)
 */

import express from "express";
import { ProgressController } from "../controllers/progressController.js";
import { ProgressService } from "../../core/services/ProgressService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize dependencies (ProgressRepository uses shared Prisma client from models/index.js)
const progressRepository = new ProgressRepository();
const progressService = new ProgressService(progressRepository);
const progressController = new ProgressController(progressService);

// All progress routes require authentication
// Note: These are relative paths - main app mounts them under /api
router.get(
  ROUTE_PATTERNS.progress,
  authenticateToken,
  asyncHandler(progressController.getAllProgress.bind(progressController)),
);
router.get(
  ROUTE_PATTERNS.progressStats,
  authenticateToken,
  asyncHandler(progressController.getProgressStats.bind(progressController)),
);
router.get(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.getWordProgress.bind(progressController)),
);
router.put(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.updateWordProgress.bind(progressController)),
);
router.delete(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.deleteWordProgress.bind(progressController)),
);
router.post(
  ROUTE_PATTERNS.progressBatch,
  authenticateToken,
  asyncHandler(progressController.batchUpdateProgress.bind(progressController)),
);

export default router;
