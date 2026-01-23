/**
 * @file apps/backend/src/api/routes/ttsRoutes.js
 * @description Text-to-speech routes with proper DI wiring
 */

import express from "express";
import TtsController from "../controllers/ttsController.js";
import { CachedTTSService } from "../../core/services/CachedTTSService.js";
import { getCacheService } from "../../infrastructure/cache/index.js";
import * as gcsClient from "../../infrastructure/external/GCSClient.js";
import * as ttsClient from "../../infrastructure/external/GoogleTTSClient.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerCacheMetrics } from "../middleware/cacheMetrics.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize TTS service wrapper (matching ITTSClient interface)
const ttsService = {
  async synthesizeSpeech(text, options) {
    return ttsClient.synthesizeSpeech(text, options);
  },
  async healthCheck() {
    return true; // TTS service doesn't have explicit health check
  },
};

// Initialize TTS service with caching
const cacheService = getCacheService();
const cachedTtsService = new CachedTTSService(ttsService, cacheService);

// Initialize controller with proper dependencies
const ttsController = new TtsController(cachedTtsService, gcsClient);

// Register metrics for monitoring
registerCacheMetrics("TTS", () => cachedTtsService.getMetrics());

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1tts
router.post(
  ROUTE_PATTERNS.ttsAudio,
  authenticateToken,
  asyncHandler(ttsController.getTtsAudio.bind(ttsController)),
);

export default router;
