/**
 * @file apps/backend/src/modules/foundations/api/foundationsRoutes.js
 * @description Routes for serving foundations reference data
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 *
 * Controller is injected via req.foundationsController middleware.
 */

import express from "express";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

/**
 * GET /v1/foundations/data/pinyin-tones
 * Returns the full pinyin + tones reference data pool.
 * Reads from GCS in production or local file in development.
 */
router.get(
  ROUTE_PATTERNS.foundationsPinyinTones,
  asyncHandler((req, res) => req.foundationsController.getPinyinTonesPool(req, res)),
);

/**
 * GET /v1/foundations/data/pinyin-character-map
 * Returns a pinyin syllable -> Chinese character mapping for TTS audio.
 * Built from phase1-entries.json to avoid per-click API lookups.
 */
router.get(
  ROUTE_PATTERNS.foundationsPinyinCharacterMap,
  asyncHandler((req, res) => req.foundationsController.getPinyinCharacterMap(req, res)),
);

/**
 * GET /v1/foundations/data/strokes
 * Returns the strokes reference data (basic strokes, stroke order rules, suggested characters).
 * Reads from GCS in production or local file in development.
 */
router.get(
  ROUTE_PATTERNS.foundationsStrokes,
  asyncHandler((req, res) => req.foundationsController.getStrokesReference(req, res)),
);

export default router;
