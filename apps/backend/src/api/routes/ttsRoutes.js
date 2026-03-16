/**
 * @file apps/backend/src/api/routes/ttsRoutes.js
 * @description Text-to-speech routes with proper DI wiring
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { ttsController } from "../../container.js";

const router = express.Router();

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1tts
router.post(
  ROUTE_PATTERNS.ttsAudio,
  authenticateToken,
  asyncHandler(ttsController.getTtsAudio.bind(ttsController)),
);

export default router;
