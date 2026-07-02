/**
 * @file apps/backend/src/shared/api/ttsRoutes.js
 * @description Text-to-speech routes with proper DI wiring
 * Migrated from modules/tts/api/ttsRoutes.js — TTS is cross-cutting infrastructure.
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { ttsController } from "../../app/container.js";

const router = express.Router();

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1tts
router.post(
  ROUTE_PATTERNS.ttsAudio,
  authenticateToken,
  asyncHandler(ttsController.getTtsAudio.bind(ttsController)),
);

export default router;
