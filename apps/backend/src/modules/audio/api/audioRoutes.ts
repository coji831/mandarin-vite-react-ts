/**
 * @file apps/backend/src/modules/audio/api/audioRoutes.ts
 * @description Audio (text-to-speech) routes with proper DI wiring.
 * The public wire path is POST /v1/tts — a documented API contract.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import express from "express";
import { audioController } from "../../../app/container.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { optionalAuth } from "../../../shared/middleware/authMiddleware.js";

const router = express.Router();

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1tts
router.post(
  ROUTE_PATTERNS.ttsAudio,
  optionalAuth,
  asyncHandler(audioController.getTtsAudio.bind(audioController)),
);

export default router;
