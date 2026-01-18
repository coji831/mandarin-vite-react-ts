/**
 * @file apps/backend/src/routes/progress.js
 * @description Progress tracking routes (mounted under /api in index.js)
 */

import express from "express";
import * as progressController from "../controllers/progressController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// All progress routes require authentication
// Note: These are relative paths - main app mounts them under /api
router.get(ROUTE_PATTERNS.progress, authenticateToken, progressController.getAllProgress);
router.get(ROUTE_PATTERNS.progressStats, authenticateToken, progressController.getProgressStats);
router.get(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  progressController.getWordProgress
);
router.put(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  progressController.updateWordProgress
);
router.delete(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  progressController.deleteWordProgress
);
router.post(
  ROUTE_PATTERNS.progressBatch,
  authenticateToken,
  progressController.batchUpdateProgress
);

export default router;
