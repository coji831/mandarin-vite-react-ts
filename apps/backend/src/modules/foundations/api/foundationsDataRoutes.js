/**
 * @file apps/backend/src/modules/foundations/api/foundationsDataRoutes.js
 * @description Routes for serving foundations reference data
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 */

import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { foundationsDataController } from "../../../app/container.js";

const router = express.Router();

/**
 * GET /v1/foundations/data/pinyin-tones
 * Returns the full pinyin + tones reference data pool.
 * Reads from GCS in production or local file in development.
 */
router.get(
  "/v1/foundations/data/pinyin-tones",
  asyncHandler((req, res) => foundationsDataController.getPinyinTonesPool(req, res)),
);

export default router;
